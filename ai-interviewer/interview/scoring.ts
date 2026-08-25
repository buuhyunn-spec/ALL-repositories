import { EvaluationResult, JobRubric, Recommendation } from "../types";

// ─────────────────────────────────────────────
// Determine recommendation from total score
// ─────────────────────────────────────────────

export function makeRecommendation(
  totalScore: number,
  rubric: JobRubric
): Recommendation {
  if (totalScore >= rubric.advanceThreshold) {
    return "ADVANCE";
  } else if (totalScore >= rubric.reviewThreshold) {
    return "REVIEW";
  } else {
    return "DO_NOT_ADVANCE";
  }
}

// ─────────────────────────────────────────────
// Calculate total score from competency scores
// Weights are percentages — total must equal 100
// ─────────────────────────────────────────────

export function calculateTotalScore(
  scores: EvaluationResult["scores"],
  rubric: JobRubric
): number {
  let total = 0;

  for (const competency of rubric.competencies) {
    const scored = scores[competency.key];
    if (!scored) continue;

    // Normalize to percentage of max, then apply weight
    const pct = scored.score / competency.maxScore;
    total += pct * competency.weight;
  }

  return Math.round(total);
}

// ─────────────────────────────────────────────
// Format score summary for display
// ─────────────────────────────────────────────

export function formatScoreSummary(
  result: EvaluationResult,
  rubric: JobRubric
): string {
  const lines = rubric.competencies.map(c => {
    const score = result.scores[c.key];
    const bar = score
      ? `${score.score}/${c.maxScore}`
      : "not scored";
    return `  ${c.name.padEnd(25)} ${bar}`;
  });

  return [
    `Candidate Score: ${result.totalScore}/100`,
    `Recommendation:  ${result.recommendation}`,
    "",
    "Competency Breakdown:",
    ...lines,
    "",
    `Strengths: ${result.strengths.join(", ")}`,
    `Concerns:  ${result.concerns.join(", ")}`
  ].join("\n");
}
