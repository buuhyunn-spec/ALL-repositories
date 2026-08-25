import { EvaluationResult, InterviewSession, JobRubric } from "../types";
import { formatScoreSummary } from "../interview/scoring";

// ─────────────────────────────────────────────
// Generate a formatted report for the dashboard
// No Claude call needed — formats existing data
// ─────────────────────────────────────────────

export interface InterviewReport {
  candidateName: string;
  position: string;
  interviewedAt: string;
  duration: string;
  totalScore: number;
  recommendation: string;
  competencyScores: Array<{
    name: string;
    score: number;
    maxScore: number;
    evidence: string;
  }>;
  strengths: string[];
  concerns: string[];
  summary: string;
  transcript: Array<{ speaker: string; text: string; timestamp: string }>;
}

export function generateReport(
  session: InterviewSession,
  result: EvaluationResult
): InterviewReport {
  const rubric = session.jobRubric;

  const duration = session.startedAt && session.endedAt
    ? formatDuration(session.startedAt, session.endedAt)
    : "Unknown";

  const competencyScores = rubric.competencies.map(c => {
    const scored = result.scores[c.key] ?? { score: 0, evidence: "Not assessed" };
    return {
      name:      c.name,
      score:     scored.score,
      maxScore:  c.maxScore,
      evidence:  scored.evidence
    };
  });

  return {
    candidateName:    session.candidateName,
    position:         rubric.position,
    interviewedAt:    session.startedAt ?? session.scheduledAt,
    duration,
    totalScore:       result.totalScore,
    recommendation:   result.recommendation,
    competencyScores,
    strengths:        result.strengths,
    concerns:         result.concerns,
    summary:          result.summary,
    transcript:       session.transcript
  };
}

// ─────────────────────────────────────────────
// Plain text report for email notifications
// ─────────────────────────────────────────────

export function generateTextReport(
  session: InterviewSession,
  result: EvaluationResult
): string {
  const report = generateReport(session, result);

  const lines = [
    `═══════════════════════════════════════`,
    `INTERVIEW REPORT`,
    `═══════════════════════════════════════`,
    `Candidate:     ${report.candidateName}`,
    `Position:      ${report.position}`,
    `Interviewed:   ${report.interviewedAt}`,
    `Duration:      ${report.duration}`,
    ``,
    `SCORE: ${report.totalScore}/100`,
    `RECOMMENDATION: ${report.recommendation}`,
    ``,
    `COMPETENCY SCORES:`,
    ...report.competencyScores.map(
      c => `  ${c.name.padEnd(25)} ${c.score}/${c.maxScore}`
    ),
    ``,
    `STRENGTHS:`,
    ...report.strengths.map(s => `  ✓ ${s}`),
    ``,
    `CONCERNS:`,
    ...report.concerns.map(c => `  ⚠ ${c}`),
    ``,
    `SUMMARY:`,
    `  ${report.summary}`,
    `═══════════════════════════════════════`
  ];

  return lines.join("\n");
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
