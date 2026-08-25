// ─────────────────────────────────────────────
// Compliance Safeguards
//
// These rules are injected into every Claude
// system prompt and enforced at the prompt level.
// ─────────────────────────────────────────────

export const COMPLIANCE_RULES = `
COMPLIANCE — NEVER EVALUATE OR COMMENT ON THESE:
- Accent, language style, speech pace, or fluency
- Filler words, pauses, or verbal habits
- Age, gender, ethnicity, or national origin
- Religion, marital status, or family situation
- Health conditions or disabilities
- Appearance or any non-job-related trait

EVALUATE ONLY:
- Job-relevant skills and experience
- Demonstrated competencies from specific examples
- Availability and schedule fit
- Answers to role-specific questions

If a candidate voluntarily shares protected information
(e.g. mentions a disability), do not acknowledge or score it.
Redirect naturally to the next question.
`.trim();

// ─────────────────────────────────────────────
// Questions that must never be asked
// ─────────────────────────────────────────────

export const DISALLOWED_QUESTIONS = [
  "How old are you?",
  "Are you married?",
  "Do you have children?",
  "What is your nationality?",
  "What religion do you practice?",
  "Do you have any health conditions?",
  "Are you pregnant or planning to have children?",
  "What country are you from originally?"
];

export const DISALLOWED_QUESTION_PROMPT = `
NEVER ASK:
${DISALLOWED_QUESTIONS.map(q => `- ${q}`).join("\n")}
Or any variation of the above.
`.trim();
