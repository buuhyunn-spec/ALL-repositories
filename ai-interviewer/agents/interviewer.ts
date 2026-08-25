import { GoogleGenerativeAI } from "@google/generative-ai";
import { InterviewSession, InterviewStage, InterviewerResponse, JobRubric } from "../types";
import { getNextStage, getStageObjective } from "../interview/state-machine";
import { COMPLIANCE_RULES, DISALLOWED_QUESTION_PROMPT } from "../interview/safeguards";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─────────────────────────────────────────────
// Opening script — hardcoded, no API call needed
// ─────────────────────────────────────────────

export function getOpeningScript(
  candidateName: string,
  position: string
): string {
  const firstName = candidateName.split(" ")[0];
  return (
    `Hi ${firstName}. I'm the AI interview assistant for the ${position} position. ` +
    `I'll be conducting your initial screening interview today. ` +
    `This conversation will be transcribed and reviewed by our hiring team. ` +
    `Are you comfortable proceeding?`
  );
}

// ─────────────────────────────────────────────
// Main entry — called on every candidate turn
// ─────────────────────────────────────────────

export async function getNextResponse(
  session: InterviewSession,
  candidateAnswer: string
): Promise<InterviewerResponse> {

  session.conversationHistory.push({
    role: "user",
    content: candidateAnswer
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",   // free tier
    systemInstruction: buildSystemPrompt(session)
  });

  // Build Gemini chat history format
  // Gemini requires history to START with a user message — skip any
  // leading assistant messages (e.g. the opening script)
  const allHistory = session.conversationHistory.slice(0, -1).map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  // Drop leading "model" turns until we hit the first "user" turn
  let startIdx = 0;
  while (startIdx < allHistory.length && allHistory[startIdx].role === "model") {
    startIdx++;
  }
  const history = allHistory.slice(startIdx);

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(candidateAnswer);
  const raw = result.response.text();

  const parsed = parseResponse(raw);

  session.conversationHistory.push({
    role: "assistant",
    content: parsed.speech
  });

  return parsed;
}

// ─────────────────────────────────────────────
// Handle response + update session stage
// ─────────────────────────────────────────────

export async function handleInterviewerResponse(
  session: InterviewSession,
  candidateAnswer: string
): Promise<{
  speech: string;
  shouldEnd: boolean;
  newStage: InterviewStage | null;
}> {
  const result = await getNextResponse(session, candidateAnswer);

  console.log(`[interviewer] Stage: ${session.stage} | Action: ${result.action}`);
  console.log(`[interviewer] Note: ${result.internal_note}`);

  let newStage: InterviewStage | null = null;
  let shouldEnd = false;

  switch (result.action) {
    case "advance_stage": {
      const next = getNextStage(session.stage);
      if (next) {
        newStage = next;
      } else {
        shouldEnd = true;
      }
      break;
    }
    case "end_interview": {
      shouldEnd = true;
      break;
    }
  }

  return { speech: result.speech, shouldEnd, newStage };
}

// ─────────────────────────────────────────────
// System prompt — rebuilt on every call
// ─────────────────────────────────────────────

function buildSystemPrompt(session: InterviewSession): string {
  const { jobRubric, stage, questionsAsked, candidateName } = session;

  return `
You are an AI interviewer conducting an initial screening interview.
Candidate: ${candidateName}
Position: ${jobRubric.position}
Current stage: ${stage}

═══════════════════════════════════════════
CURRENT STAGE OBJECTIVE
═══════════════════════════════════════════
${getStageObjective(stage, jobRubric)}

═══════════════════════════════════════════
COMPETENCIES TO LISTEN FOR
═══════════════════════════════════════════
${formatCompetencies(jobRubric)}

═══════════════════════════════════════════
QUESTIONS NOT YET ASKED
═══════════════════════════════════════════
${getUnaskedQuestions(jobRubric, questionsAsked)}

═══════════════════════════════════════════
FOLLOW-UP RULES
═══════════════════════════════════════════
- If an answer is vague, ask ONE follow-up
- If an answer fully covers the question, move on
- Maximum 2 follow-ups per question then move forward
- Keep responses brief — under 3 sentences

═══════════════════════════════════════════
${COMPLIANCE_RULES}

${DISALLOWED_QUESTION_PROMPT}

═══════════════════════════════════════════
OUTPUT — ALWAYS RETURN VALID JSON ONLY
═══════════════════════════════════════════
{
  "speech": "Exactly what you say out loud to the candidate",
  "action": "continue" | "advance_stage" | "end_interview",
  "internal_note": "One sentence: why you chose this action"
}

Return ONLY the JSON object. No markdown. No extra text.
`.trim();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatCompetencies(rubric: JobRubric): string {
  return rubric.competencies
    .map(c => `- ${c.name} (${c.weight}%): ${c.description}`)
    .join("\n");
}

function getUnaskedQuestions(rubric: JobRubric, questionsAsked: string[]): string {
  const all = [...rubric.standardQuestions, ...rubric.roleSpecificQuestions];
  const unasked = all.filter(q => !questionsAsked.includes(q));
  if (unasked.length === 0) return "All planned questions have been covered.";
  return unasked.map((q, i) => `${i + 1}. ${q}`).join("\n");
}

function parseResponse(raw: string): InterviewerResponse {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.speech || !parsed.action) throw new Error("Missing fields");
    const valid = ["continue", "advance_stage", "end_interview"];
    if (!valid.includes(parsed.action)) parsed.action = "continue";
    return parsed as InterviewerResponse;
  } catch {
    console.error("[interviewer] Parse error:", raw);
    return {
      speech: "Could you tell me a little more about that?",
      action: "continue",
      internal_note: "Parse error — fallback used"
    };
  }
}
