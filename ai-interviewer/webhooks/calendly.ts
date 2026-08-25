import express from "express";
import crypto from "crypto";
import { CalendlyPayload } from "../types";
import { getCandidateByEmail } from "../database/candidates";
import { getJobRubricForPosition } from "../database/jobs";
import {
  createInterviewSession,
  getSessionByCalendlyUri,
  cancelSession,
  saveSession
} from "../database/interviews";
import { scheduleRecallBot, cancelRecallBot } from "../services/recall";
import { extractMeetUrl } from "../services/calendly";
import {
  sendInterviewConfirmation,
  sendCancellationNotice
} from "../services/notifications";

const router = express.Router();

// ─────────────────────────────────────────────
// Signature verification
// Calendly format: "t=TIMESTAMP,v1=HMAC_SHA256"
// ─────────────────────────────────────────────

function verifyCalendlySignature(req: express.Request): boolean {
  const header = req.headers["calendly-webhook-signature"] as string;
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map(p => p.split("=") as [string, string])
  );

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Replay attack protection — reject events older than 5 minutes
  const age = Date.now() - parseInt(timestamp) * 1000;
  if (age > 5 * 60 * 1000) return false;

  const secret = process.env.CALENDLY_WEBHOOK_SECRET!;
  const toSign = `${timestamp}.${JSON.stringify(req.body)}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(toSign)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────

router.post("/webhooks/calendly", async (req: express.Request, res: express.Response) => {
  res.status(200).json({ received: true });

  if (!verifyCalendlySignature(req)) {
    console.warn("[calendly webhook] Invalid signature — ignored");
    return;
  }

  const { event, payload } = req.body as {
    event: string;
    payload: CalendlyPayload;
  };

  console.log(`[calendly webhook] ${event} | ${payload?.email}`);

  try {
    switch (event) {
      case "invitee.created":
        await handleBooking(payload);
        break;

      case "invitee.canceled":
        if (payload.rescheduled) {
          await handleReschedule(payload);
        } else {
          await handleCancellation(payload);
        }
        break;

      default:
        console.log(`[calendly webhook] Unhandled: ${event}`);
    }
  } catch (err) {
    console.error(`[calendly webhook] Error [${event}]:`, err);
  }
});

// ─────────────────────────────────────────────
// New booking
// ─────────────────────────────────────────────

async function handleBooking(payload: CalendlyPayload): Promise<void> {
  const { name, email, scheduled_event, uri: inviteeUri } = payload;
  const startTime = scheduled_event.start_time;

  console.log(`[booking] ${name} | ${email} | ${startTime}`);

  // Prevent duplicates
  const existing = await getSessionByCalendlyUri(inviteeUri);
  if (existing) {
    console.log(`[booking] Session already exists — skipping`);
    return;
  }

  // Find candidate by email
  const candidate = await getCandidateByEmail(email);
  if (!candidate) {
    console.warn(`[booking] Unknown email: ${email} — no candidate record`);
    return;
  }

  // Load job rubric
  const rubric = await getJobRubricForPosition(candidate.position);
  if (!rubric) {
    console.error(`[booking] No rubric for position: ${candidate.position}`);
    return;
  }

  // Extract Meet URL
  const meetUrl = extractMeetUrl(scheduled_event);

  // Create interview session
  const session = await createInterviewSession({
    candidateId:         candidate.id,
    candidateName:       candidate.name,
    candidateEmail:      candidate.email,
    jobRubric:           rubric,
    botId:               "",
    meetUrl,
    scheduledAt:         startTime,
    status:              "scheduled",
    stage:               "consent",
    calendlyInviteeUri:  inviteeUri,
    transcript:          [],
    conversationHistory: [],
    questionsAsked:      []
  });

  // Schedule the Recall bot
  const bot = await scheduleRecallBot({
    meetUrl,
    scheduledAt: startTime,
    botName:     "AI Interviewer",
    sessionId:   session.id
  });

  // Save bot ID back to session
  await saveSession({ ...session, botId: bot.id });

  // Notify candidate
  await sendInterviewConfirmation({
    candidateEmail: email,
    candidateName:  name,
    scheduledAt:    startTime,
    meetUrl
  });

  console.log(`[booking] Session ${session.id} created | bot ${bot.id}`);
}

// ─────────────────────────────────────────────
// Real cancellation
// ─────────────────────────────────────────────

async function handleCancellation(payload: CalendlyPayload): Promise<void> {
  const { name, email, uri: inviteeUri, cancellation } = payload;
  console.log(`[cancel] ${name} | reason: ${cancellation?.reason}`);

  const session = await getSessionByCalendlyUri(inviteeUri);
  if (!session) {
    console.warn(`[cancel] No session for URI: ${inviteeUri}`);
    return;
  }

  // Don't cancel if already in progress or done
  if (["in_progress", "evaluating", "complete"].includes(session.status)) {
    console.log(`[cancel] Interview ${session.status} — skip cancel`);
    return;
  }

  if (session.botId) {
    await cancelRecallBot(session.botId);
  }

  await cancelSession(session.id, {
    canceledAt:  new Date().toISOString(),
    cancelReason: cancellation?.reason ?? "Candidate canceled"
  });

  await sendCancellationNotice({
    candidateName:  name,
    candidateEmail: email,
    scheduledAt:    session.scheduledAt,
    reason:         cancellation?.reason
  });

  console.log(`[cancel] Session ${session.id} canceled`);
}

// ─────────────────────────────────────────────
// Reschedule (cancel old → new invitee.created fires next)
// ─────────────────────────────────────────────

async function handleReschedule(payload: CalendlyPayload): Promise<void> {
  const { name, uri: oldUri, new_invitee: newUri } = payload;
  console.log(`[reschedule] ${name} | ${oldUri} → ${newUri}`);

  const oldSession = await getSessionByCalendlyUri(oldUri);
  if (!oldSession) {
    console.warn(`[reschedule] No existing session for old URI`);
    return;
  }

  // Cancel old bot
  if (oldSession.botId) {
    await cancelRecallBot(oldSession.botId);
  }

  // Mark old session as rescheduled (audit trail)
  await cancelSession(oldSession.id, {
    canceledAt:         new Date().toISOString(),
    cancelReason:       "Rescheduled by candidate",
    rescheduledToUri:   newUri ?? undefined
  });

  console.log(`[reschedule] Old session ${oldSession.id} marked rescheduled`);
  console.log(`[reschedule] Waiting for new invitee.created...`);
  // New invitee.created fires next → handleBooking() creates fresh session
}

export default router;
