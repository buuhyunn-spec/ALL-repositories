import { readSheet, appendRow, updateRow } from "./base";
import { TABS } from "./client";
import { EvaluationResult } from "../types";

// Tab columns — recruiters read this directly in Sheets:
// id | interview_id | candidate_name | position | interviewed_at
// total_score | recommendation
// [competency]_score | [competency]_evidence  (one pair per competency)
// strengths | concerns | summary
// human_decision | decided_by | decided_at

export async function saveEvaluation(
  interviewId: string,
  candidateName: string,
  position: string,
  interviewedAt: string,
  result: EvaluationResult
): Promise<void> {
  // Flatten competency scores into individual columns
  // Makes it easy for recruiters to filter and sort in Sheets
  const competencyColumns: Record<string, string> = {};
  for (const [key, val] of Object.entries(result.scores)) {
    competencyColumns[`${key}_score`]    = String(val.score);
    competencyColumns[`${key}_evidence`] = val.evidence;
  }

  await appendRow(TABS.scores, {
    interview_id:    interviewId,
    candidate_name:  candidateName,
    position,
    interviewed_at:  interviewedAt,
    total_score:     result.totalScore,
    recommendation:  result.recommendation,
    ...competencyColumns,
    strengths:       result.strengths.join(" | "),
    concerns:        result.concerns.join(" | "),
    summary:         result.summary,
    human_decision:  "pending",
    decided_by:      "",
    decided_at:      ""
  });
}

export async function recordHumanDecision(
  interviewId: string,
  decision: "approved" | "rejected",
  decidedBy: string
): Promise<void> {
  const rows = await readSheet(TABS.scores);
  const row = rows.find(r => r.interview_id === interviewId);
  if (!row) throw new Error(`Score row not found for interview: ${interviewId}`);

  await updateRow(TABS.scores, row._rowIndex, {
    ...row,
    human_decision: decision,
    decided_by:     decidedBy,
    decided_at:     new Date().toISOString()
  });
}

export async function getScoreByInterviewId(
  interviewId: string
): Promise<EvaluationResult | null> {
  const rows = await readSheet(TABS.scores);
  const row = rows.find(r => r.interview_id === interviewId);
  if (!row) return null;

  // Reconstruct scores object from flat columns
  const scores: Record<string, { score: number; evidence: string }> = {};
  const skipKeys = new Set([
    "id", "interview_id", "candidate_name", "position",
    "interviewed_at", "total_score", "recommendation",
    "strengths", "concerns", "summary",
    "human_decision", "decided_by", "decided_at", "_rowIndex"
  ]);

  for (const [key, val] of Object.entries(row)) {
    if (skipKeys.has(key)) continue;
    if (key.endsWith("_score")) {
      const competency = key.replace("_score", "");
      if (!scores[competency]) scores[competency] = { score: 0, evidence: "" };
      scores[competency].score = Number(val);
    }
    if (key.endsWith("_evidence")) {
      const competency = key.replace("_evidence", "");
      if (!scores[competency]) scores[competency] = { score: 0, evidence: "" };
      scores[competency].evidence = val;
    }
  }

  return {
    scores,
    totalScore:      Number(row.total_score),
    recommendation:  row.recommendation,
    strengths:       row.strengths ? row.strengths.split(" | ") : [],
    concerns:        row.concerns ? row.concerns.split(" | ") : [],
    summary:         row.summary
  };
}
