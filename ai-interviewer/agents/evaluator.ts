import Anthropic from "@anthropic-ai/sdk";
import { InterviewSession, EvaluationResult, JobRubric } from "../types";
import { makeRecommendation } from "../interview/scoring";
import { COMPLIANCE_RULES } from "../interview/safeguards";
import { saveEvaluation } from "../database/scores";
import { saveSession } from "../database/interviews";
import { sendEvaluationComplete } from "../services/notifications";

const client = new Anthropic();

// ─────────────────────────────────────────────
// Trigger evaluation after call ends
// ─────────────────────────────────────────────

export async function triggerEvaluation(
  session: InterviewSession
): Promise<void> {
  try {
    console.log(`[evaluator] Starting evaluation: ${session.id}`);

    const result = await evaluateInterview(
      session.transcript.map(e => `${e.speaker}: ${e.text}`).join("\n"),
      session.jobRubric
    );

    // Save to scores tab in Sheets
    await saveEvaluation(
      session.id,
      session.candidateName,
      session.jobRubric.position,
      session.endedAt ?? new Date().toISOString(),
      result
    );

    session.evaluation = result;
    session.status = "complete";
    await saveSession(session);

    // Notify recruiter
    await sendEvaluationComplete(session, result);

    console.log(`[evaluator] Done: ${result.totalScore}/100 — ${result.recommendation}`);

  } catch (err) {
    console.error(`[evaluator] Error for session ${session.id}:`, err);
    session.status = "failed";
    await saveSession(session);
  }
}

// ─────────────────────────────────────────────
// Score the full transcript — one Claude call
// ─────────────────────────────────────────────

export async function evaluateInterview(
  formattedTranscript: string,
  rubric: JobRubric
): Promise<EvaluationResult> {

  const competencySchema = rubric.competencies
    .map(c => `"${c.key}": { "score": 0-${c.maxScore}, "evidence": "quote or summary from transcript" }`)
    .join(",\n    ");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    system: `
You are an interview evaluator for the position of ${rubric.position}.
Your job is to score the candidate based ONLY on evidence from the transcript.

${COMPLIANCE_RULES}

SCORING GUIDE:
${rubric.competencies.map(c =>
  `- ${c.name} (key: "${c.key}", max: ${c.maxScore}): ${c.description}`
).join("\n")}

THRESHOLDS:
- ADVANCE:          ${rubric.advanceThreshold}+ total
- REVIEW:           ${rubric.reviewThreshold}–${rubric.advanceThreshold - 1} total
- DO_NOT_ADVANCE:   below ${rubric.reviewThreshold} total

Return ONLY valid JSON. No markdown. No extra text.
    `.trim(),

    messages: [{
      role: "user",
      content: `
TRANSCRIPT:
${formattedTranscript}

Score this candidate and return this exact JSON structure:
{
  "scores": {
    ${competencySchema}
  },
  "totalScore": <weighted total 0-100>,
  "recommendation": "ADVANCE" | "REVIEW" | "DO_NOT_ADVANCE",
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "summary": "2-3 sentence summary of the candidate"
}
      `.trim()
    }]
  });

  const raw = response.content[0].type === "text"
    ? response.content[0].text
    : "";

  return parseEvaluation(raw, rubric);
}

// ─────────────────────────────────────────────
// Parse and validate Claude's evaluation JSON
// ─────────────────────────────────────────────

function parseEvaluation(raw: string, rubric: JobRubric): EvaluationResult {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Validate recommendation
    const validRecs = ["ADVANCE", "REVIEW", "DO_NOT_ADVANCE"];
    if (!validRecs.includes(parsed.recommendation)) {
      parsed.recommendation = makeRecommendation(parsed.totalScore, rubric);
    }

    // Clamp total score
    parsed.totalScore = Math.max(0, Math.min(100, Number(parsed.totalScore)));

    return parsed as EvaluationResult;

  } catch (err) {
    console.error("[evaluator] Failed to parse evaluation:", raw);

    // Return minimal valid result so we don't lose the interview
    return {
      scores: {},
      totalScore: 0,
      recommendation: "REVIEW",
      strengths: [],
      concerns: ["Evaluation parsing failed — manual review required"],
      summary: "Automatic evaluation failed. Please review transcript manually."
    };
  }
}
