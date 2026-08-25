import { GoogleGenerativeAI } from "@google/generative-ai";
import { InterviewSession, EvaluationResult, JobRubric } from "../types";
import { makeRecommendation } from "../interview/scoring";
import { COMPLIANCE_RULES } from "../interview/safeguards";
import { saveEvaluation } from "../database/scores";
import { saveSession } from "../database/interviews";
import { sendEvaluationComplete } from "../services/notifications";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─────────────────────────────────────────────
// Trigger evaluation after call ends
// ─────────────────────────────────────────────

export async function triggerEvaluation(
  session: InterviewSession
): Promise<void> {
  try {
    console.log(`[evaluator] Starting evaluation: ${session.id}`);

    const transcriptText = session.transcript
      .map(e => `${e.speaker}: ${e.text}`)
      .join("\n");

    const result = await evaluateInterview(transcriptText, session.jobRubric);

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

    await sendEvaluationComplete(session, result);

    console.log(`[evaluator] Done: ${result.totalScore}/100 — ${result.recommendation}`);

  } catch (err) {
    console.error(`[evaluator] Error for session ${session.id}:`, err);
    session.status = "failed";
    await saveSession(session);
  }
}

// ─────────────────────────────────────────────
// Score full transcript — one Gemini call
// ─────────────────────────────────────────────

export async function evaluateInterview(
  formattedTranscript: string,
  rubric: JobRubric
): Promise<EvaluationResult> {

  const competencySchema = rubric.competencies
    .map(c => `"${c.key}": { "score": 0-${c.maxScore}, "evidence": "quote or summary" }`)
    .join(",\n    ");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
You are an interview evaluator for the position of ${rubric.position}.
Score the candidate based ONLY on evidence from the transcript.

${COMPLIANCE_RULES}

COMPETENCIES:
${rubric.competencies.map(c =>
  `- ${c.name} (key: "${c.key}", max: ${c.maxScore}): ${c.description}`
).join("\n")}

THRESHOLDS:
- ADVANCE:        ${rubric.advanceThreshold}+ total
- REVIEW:         ${rubric.reviewThreshold}–${rubric.advanceThreshold - 1} total
- DO_NOT_ADVANCE: below ${rubric.reviewThreshold} total

Return ONLY valid JSON. No markdown. No extra text.
    `.trim()
  });

  const prompt = `
TRANSCRIPT:
${formattedTranscript}

Return this exact JSON:
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
  `.trim();

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  return parseEvaluation(raw, rubric);
}

// ─────────────────────────────────────────────
// Parse Gemini's evaluation JSON
// ─────────────────────────────────────────────

function parseEvaluation(raw: string, rubric: JobRubric): EvaluationResult {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const validRecs = ["ADVANCE", "REVIEW", "DO_NOT_ADVANCE"];
    if (!validRecs.includes(parsed.recommendation)) {
      parsed.recommendation = makeRecommendation(parsed.totalScore, rubric);
    }
    parsed.totalScore = Math.max(0, Math.min(100, Number(parsed.totalScore)));
    return parsed as EvaluationResult;
  } catch {
    console.error("[evaluator] Parse error:", raw);
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
