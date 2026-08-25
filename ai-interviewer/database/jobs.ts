import { readSheet, safeParseJSON } from "./base";
import { TABS } from "./client";
import { JobRubric } from "../types";

// Tab columns:
// id | position | min_requirements | competencies
// advance_threshold | review_threshold
// standard_questions | role_specific_questions | active

export async function getJobRubricForPosition(
  position: string
): Promise<JobRubric | null> {
  const rows = await readSheet(TABS.jobs);
  const row = rows.find(
    r =>
      r.position?.toLowerCase() === position.toLowerCase() &&
      r.active === "true"
  );
  if (!row) return null;

  return {
    id:                    row.id,
    position:              row.position,
    minimumRequirements:   safeParseJSON<string[]>(row.min_requirements, []),
    competencies:          safeParseJSON(row.competencies, []),
    advanceThreshold:      Number(row.advance_threshold),
    reviewThreshold:       Number(row.review_threshold),
    standardQuestions:     safeParseJSON<string[]>(row.standard_questions, []),
    roleSpecificQuestions: safeParseJSON<string[]>(row.role_specific_questions, []),
    active:                row.active === "true"
  };
}

export async function getAllJobRubrics(): Promise<JobRubric[]> {
  const rows = await readSheet(TABS.jobs);
  return rows.map(row => ({
    id:                    row.id,
    position:              row.position,
    minimumRequirements:   safeParseJSON<string[]>(row.min_requirements, []),
    competencies:          safeParseJSON(row.competencies, []),
    advanceThreshold:      Number(row.advance_threshold),
    reviewThreshold:       Number(row.review_threshold),
    standardQuestions:     safeParseJSON<string[]>(row.standard_questions, []),
    roleSpecificQuestions: safeParseJSON<string[]>(row.role_specific_questions, []),
    active:                row.active === "true"
  }));
}
