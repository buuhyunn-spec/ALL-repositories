import { InterviewStage, JobRubric } from "../types";

const STAGE_ORDER: InterviewStage[] = [
  "consent",
  "requirements",
  "experience",
  "situational",
  "role_specific",
  "candidate_questions",
  "closing"
];

export function getNextStage(current: InterviewStage): InterviewStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return STAGE_ORDER[idx + 1] ?? null;
}

export function isInterviewComplete(stage: InterviewStage): boolean {
  return stage === "closing";
}

// What Claude is trying to accomplish in each stage
export function getStageObjective(
  stage: InterviewStage,
  rubric: JobRubric
): string {
  const objectives: Record<InterviewStage, string> = {

    consent: `
Introduce yourself and get verbal consent before proceeding.
Say: "Hi [name]. I'm the AI interview assistant. I'll be conducting your initial
screening interview today. This conversation will be transcribed and reviewed by
our hiring team. Are you comfortable proceeding?"
Wait for a clear "yes" before continuing.
If they decline or seem uncomfortable, end the interview gracefully.
Action: advance_stage ONLY after receiving explicit consent.
    `.trim(),

    requirements: `
Verify all minimum requirements in a natural, conversational way — not as a checklist.
Requirements to confirm:
${rubric.minimumRequirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}
Example opener: "Before we dive in, I have a couple of quick questions about availability..."
Note answers but continue the interview regardless — the human reviewer will weigh failures.
Action: advance_stage once all requirements have been addressed.
    `.trim(),

    experience: `
Explore the candidate's relevant work history.
Ask about background and experience related to the role.
Listen for evidence of competencies. Ask ONE follow-up if an answer is vague.
Do not spend more than 2-3 minutes on this stage.
Action: advance_stage after covering experience sufficiently.
    `.trim(),

    situational: `
Ask ONE situational or behavioral question to test judgment and problem-solving.
Choose the most relevant question from the standard questions list.
Probe the outcome with: "What was the result of that?"
Action: advance_stage after the question and at most one follow-up.
    `.trim(),

    role_specific: `
Ask role-specific questions for ${rubric.position}.
Prioritize the most important ones — you may not cover all of them.
Skip any questions already answered naturally in earlier stages.
Action: advance_stage after covering 2-3 key role-specific questions.
    `.trim(),

    candidate_questions: `
Invite the candidate to ask questions.
Say: "We're almost done. Do you have any questions about the role or the process?"
Answer briefly. If you don't know: "Great question — the hiring team will follow up on that."
Action: advance_stage after 1-2 questions, or if they have none.
    `.trim(),

    closing: `
Close the interview warmly and professionally.
Thank them by first name.
Explain that the team will review and be in touch within a few business days.
Action: end_interview immediately after the closing statement.
    `.trim()
  };

  return objectives[stage];
}
