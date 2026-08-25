// ─────────────────────────────────────────────
// Shared TypeScript types for AI Interviewer
// Single source of truth — all files import from here
// ─────────────────────────────────────────────

// ─── Candidate ───────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  resumeUrl: string;
  status: CandidateStatus;
  notes?: string;
  createdAt?: string;
}

export type CandidateStatus =
  | "pending"
  | "scheduled"
  | "interviewed"
  | "approved"
  | "rejected";

// ─── Interview Session ────────────────────────

export interface InterviewSession {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobRubric: JobRubric;
  botId: string;
  meetUrl: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: SessionStatus;
  stage: InterviewStage;
  calendlyInviteeUri: string;
  transcript: TranscriptEntry[];
  conversationHistory: ConversationMessage[];
  questionsAsked: string[];
  evaluation?: EvaluationResult;
  cancelReason?: string;
  rescheduledToUri?: string;
  createdAt?: string;
}

export type SessionStatus =
  | "scheduled"
  | "in_progress"
  | "evaluating"
  | "complete"
  | "canceled"
  | "failed";

export type InterviewStage =
  | "consent"
  | "requirements"
  | "experience"
  | "situational"
  | "role_specific"
  | "candidate_questions"
  | "closing";

// ─── Transcript ───────────────────────────────

export interface TranscriptEntry {
  speaker: "AI Interviewer" | "Candidate";
  text: string;
  timestamp: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Job Rubric ───────────────────────────────

export interface JobRubric {
  id?: string;
  position: string;
  minimumRequirements: string[];
  competencies: Competency[];
  advanceThreshold: number;    // e.g. 80 → ADVANCE
  reviewThreshold: number;     // e.g. 65 → REVIEW, below → DO_NOT_ADVANCE
  standardQuestions: string[];
  roleSpecificQuestions: string[];
  active?: boolean;
}

export interface Competency {
  name: string;
  key: string;           // snake_case for scores object e.g. "sales_experience"
  weight: number;        // percentage e.g. 25
  maxScore: number;      // e.g. 25
  description: string;
}

// ─── Evaluation ───────────────────────────────

export interface EvaluationResult {
  scores: Record<string, CompetencyScore>;
  totalScore: number;
  recommendation: Recommendation;
  strengths: string[];
  concerns: string[];
  summary: string;
}

export interface CompetencyScore {
  score: number;
  evidence: string;
}

export type Recommendation =
  | "ADVANCE"
  | "REVIEW"
  | "DO_NOT_ADVANCE";

// ─── Interviewer Agent Response ───────────────

export interface InterviewerResponse {
  speech: string;
  action: "continue" | "advance_stage" | "end_interview";
  internal_note: string;
}

// ─── Recall.ai ───────────────────────────────

export interface RecallBot {
  id: string;
  status: RecallBotStatus;
  meeting_url: string;
  join_at: string;
  metadata: Record<string, string>;
}

export type RecallBotStatus =
  | "ready"
  | "joining_call"
  | "in_waiting_room"
  | "in_call"
  | "in_call_not_recording"
  | "in_call_recording"
  | "done"
  | "fatal";

// ─── Calendly ────────────────────────────────

export interface CalendlyPayload {
  uri: string;
  name: string;
  email: string;
  status: "active" | "canceled";
  rescheduled: boolean;
  new_invitee: string | null;
  old_invitee: string | null;
  scheduled_event: CalendlyScheduledEvent;
  cancellation?: {
    reason: string;
    canceled_by: string;
  };
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  start_time: string;
  end_time: string;
  location: {
    type: string;
    join_url?: string;
    data?: { url: string };
  };
}

// ─── Schedule Bot Options ─────────────────────

export interface ScheduleBotOptions {
  meetUrl: string;
  scheduledAt: string;
  botName: string;
  sessionId: string;
}

// ─── Notifications ────────────────────────────

export interface ConfirmationNotification {
  candidateEmail: string;
  candidateName: string;
  scheduledAt: string;
  meetUrl: string;
}

export interface CancellationNotification {
  candidateName: string;
  candidateEmail: string;
  scheduledAt: string;
  reason?: string;
}
