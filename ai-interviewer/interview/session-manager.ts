import {
  getSessionByBotId,
  saveSession
} from "../database/interviews";
import { appendTranscriptEntry } from "../database/transcript";
import { handleInterviewerResponse, getOpeningScript } from "../agents/interviewer";
import { triggerEvaluation } from "../agents/evaluator";
import { speakViaRecall, endInterviewCall } from "../services/recall";
import { clearBuffer } from "./turn-buffer";
import { InterviewSession } from "../types";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
// Bot joined the call — speak opening script
// ─────────────────────────────────────────────

export async function handleBotJoined(botId: string): Promise<void> {
  const session = await getSessionByBotId(botId);
  if (!session) {
    console.warn(`No session found for bot: ${botId}`);
    return;
  }

  session.status = "in_progress";
  session.startedAt = new Date().toISOString();

  const opening = getOpeningScript(session.candidateName, session.jobRubric.position);

  const entry = {
    speaker: "AI Interviewer" as const,
    text: opening,
    timestamp: new Date().toISOString()
  };

  session.transcript.push(entry);
  session.conversationHistory.push({ role: "assistant", content: opening });

  await saveSession(session);
  await appendTranscriptEntry(session.id, entry);

  // Small delay to let the candidate settle before AI speaks
  await sleep(2000);
  await speakViaRecall(botId, opening);
}

// ─────────────────────────────────────────────
// Candidate finished speaking — process turn
// Called by turn-buffer.ts after silence detected
// ─────────────────────────────────────────────

export async function processCompleteAnswer(
  botId: string,
  candidateAnswer: string
): Promise<void> {
  const session = await getSessionByBotId(botId);
  if (!session) return;

  // Skip if interview is no longer active
  if (session.status !== "in_progress") return;

  // Save candidate's answer
  const candidateEntry = {
    speaker: "Candidate" as const,
    text: candidateAnswer,
    timestamp: new Date().toISOString()
  };
  session.transcript.push(candidateEntry);
  await appendTranscriptEntry(session.id, candidateEntry);

  // Ask Claude what to do next
  const { speech, shouldEnd, newStage } =
    await handleInterviewerResponse(session, candidateAnswer);

  // Save AI response
  const aiEntry = {
    speaker: "AI Interviewer" as const,
    text: speech,
    timestamp: new Date().toISOString()
  };
  session.transcript.push(aiEntry);
  await appendTranscriptEntry(session.id, aiEntry);

  // Advance stage if Claude decided to
  if (newStage) {
    console.log(`Stage: ${session.stage} → ${newStage}`);
    session.stage = newStage;
  }

  // Speak the response
  await speakViaRecall(botId, speech);

  if (shouldEnd) {
    await sleep(3000); // let closing statement finish
    clearBuffer(botId);
    await endInterviewCall(botId, session);
    return;
  }

  await saveSession(session);
}

// ─────────────────────────────────────────────
// Call ended — run evaluation
// Called by recall webhook on bot.done
// ─────────────────────────────────────────────

export async function handleCallEnded(
  botId: string,
  recallTranscript?: any[]
): Promise<void> {
  const session = await getSessionByBotId(botId);
  if (!session) return;

  if (session.status === "complete" || session.status === "evaluating") {
    console.log(`Interview already ${session.status} — skip`);
    return;
  }

  session.status = "evaluating";
  session.endedAt = new Date().toISOString();
  await saveSession(session);

  clearBuffer(botId);

  // Kick off evaluation
  await triggerEvaluation(session);
}

// ─────────────────────────────────────────────
// Bot error — mark failed, alert recruiter
// ─────────────────────────────────────────────

export async function handleBotError(
  botId: string,
  errorData: any
): Promise<void> {
  console.error(`Bot fatal error [${botId}]:`, errorData);

  const session = await getSessionByBotId(botId);
  if (!session) return;

  session.status = "failed";
  session.endedAt = new Date().toISOString();
  await saveSession(session);
  clearBuffer(botId);
}
