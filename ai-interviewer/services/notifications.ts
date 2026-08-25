import {
  ConfirmationNotification,
  CancellationNotification,
  InterviewSession,
  EvaluationResult
} from "../types";
import { generateTextReport } from "../agents/report-generator";

// ─────────────────────────────────────────────
// Interview Confirmation
// ─────────────────────────────────────────────

export async function sendInterviewConfirmation(
  notification: ConfirmationNotification
): Promise<void> {
  const { candidateName, candidateEmail, scheduledAt, meetUrl } = notification;
  const firstName = candidateName.split(" ")[0];
  const formattedTime = new Date(scheduledAt).toLocaleString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
    hour:    "numeric",
    minute:  "2-digit",
    timeZoneName: "short"
  });

  const message = `
Hi ${firstName},

Your interview has been scheduled for ${formattedTime}.

Join the meeting here: ${meetUrl}

You'll be interviewed by our AI assistant, which will conduct an initial screening.
The conversation will be recorded and reviewed by our hiring team.

Good luck!
  `.trim();

  await sendEmail(candidateEmail, "Your Interview is Scheduled", message);
  console.log(`[notifications] Confirmation sent to ${candidateEmail}`);
}

// ─────────────────────────────────────────────
// Cancellation Notice
// ─────────────────────────────────────────────

export async function sendCancellationNotice(
  notification: CancellationNotification
): Promise<void> {
  const { candidateName, candidateEmail, scheduledAt, reason } = notification;

  // Notify recruiter
  const recruiterMsg = `
Interview canceled: ${candidateName} (${candidateEmail})
Scheduled: ${new Date(scheduledAt).toLocaleString()}
Reason: ${reason ?? "Not provided"}
  `.trim();

  await sendEmail(
    process.env.NOTIFICATION_EMAIL!,
    `Interview Canceled: ${candidateName}`,
    recruiterMsg
  );

  console.log(`[notifications] Cancellation notice sent`);
}

// ─────────────────────────────────────────────
// Evaluation Complete — notify recruiter
// ─────────────────────────────────────────────

export async function sendEvaluationComplete(
  session: InterviewSession,
  result: EvaluationResult
): Promise<void> {
  const report = generateTextReport(session, result);

  const subject = [
    `Interview Complete: ${session.candidateName}`,
    `| ${session.jobRubric.position}`,
    `| Score: ${result.totalScore}/100`,
    `| ${result.recommendation}`
  ].join(" ");

  await sendEmail(process.env.NOTIFICATION_EMAIL!, subject, report);

  // Also post to Google Chat if configured
  if (process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    await sendGoogleChatAlert(session, result);
  }

  console.log(`[notifications] Evaluation report sent for ${session.candidateName}`);
}

// ─────────────────────────────────────────────
// Google Chat Alert (optional)
// ─────────────────────────────────────────────

async function sendGoogleChatAlert(
  session: InterviewSession,
  result: EvaluationResult
): Promise<void> {
  const emoji = result.recommendation === "ADVANCE" ? "✅"
    : result.recommendation === "REVIEW" ? "⚠️"
    : "❌";

  const message = {
    text: [
      `${emoji} *Interview Complete*`,
      `Candidate: ${session.candidateName}`,
      `Position: ${session.jobRubric.position}`,
      `Score: *${result.totalScore}/100*`,
      `Recommendation: *${result.recommendation}*`,
      ``,
      result.summary
    ].join("\n")
  };

  await fetch(process.env.GOOGLE_CHAT_WEBHOOK_URL!, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(message)
  });
}

// ─────────────────────────────────────────────
// Generic email sender
// Swap this for your email provider (Resend, SendGrid, etc.)
// ─────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // TODO: Replace with your email provider
  // Example using Resend:
  //
  // const res = await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify({
  //     from: "AI Interviewer <noreply@yourcompany.com>",
  //     to,
  //     subject,
  //     text: body
  //   })
  // });

  // For now — log to console
  console.log(`[email] TO: ${to}`);
  console.log(`[email] SUBJECT: ${subject}`);
  console.log(`[email] BODY:\n${body}`);
}
