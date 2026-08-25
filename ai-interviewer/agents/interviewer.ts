import Anthropic from "@anthropic-ai/sdk";
import { InterviewSession, InterviewStage, InterviewerResponse, JobRubric } from "../types";
import { getNextStage } from "../interview/state-machine";
import { getStageObjective } from "../interview/state-machine";
import { COMPLIANCE_RULES, DISALLOWED_QUESTION_PROMPT } from "../interview/safeguards";

const client = new Anthropic();

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

  // Append candidate's answer to conversation history
  session.conversationHistory.push({
    role: "user",
    content: candidateAnswer
  });

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 500,
    system: buildSystemPrompt(session),
    messages: session.conversationHistory
  });

  const raw = response.content[0].type === "text"
    ? response.content[0].text
    : "";

  const parsed = parseResponse(raw);

  // Append AI's spoken response to history
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
- If an answer is vague, ask ONE follow-up: "Can you tell me more about that?"
- If an answer fully covers the question, move on — do not repeat it
- Maximum 2 follow-ups per question, then move forward
- If the candidate already answered a question naturally, skip it
- Keep responses brief and conversational — under 3 sentences

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

Action rules:
- "continue"       → still working through current stage
- "advance_stage"  → current stage objective is complete, move to next
- "end_interview"  → all stages complete or closing is done

Return ONLY the JSON object. No markdown fences. No extra text.
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

function getUnaskedQuestions(
  rubric: JobRubric,
  questionsAsked: string[]
): string {
  const all = [
    ...rubric.standardQuestions,
    ...rubric.roleSpecificQuestions
  ];
  const unasked = all.filter(q => !questionsAsked.includes(q));

  if (unasked.length === 0) {
    return "All planned questions have been covered.";
  }
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

    if (!parsed.speech || !parsed.action) {
      throw new Error("Missing required fields");
    }

    const validActions = ["continue", "advance_stage", "end_interview"];
    if (!validActions.includes(parsed.action)) {
      parsed.action = "continue";
    }

    return parsed as InterviewerResponse;

  } catch (err) {
    console.error("[interviewer] Failed to parse response:", raw);
    return {
      speech: "Could you tell me a little more about that?",
      action: "continue",
      internal_note: "Parse error — fallback used"
    };
  }
}
