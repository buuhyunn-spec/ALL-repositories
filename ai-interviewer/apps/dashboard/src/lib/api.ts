// ─────────────────────────────────────────────
// API client — server-side only
// Called from Server Components and Server Actions
// ─────────────────────────────────────────────

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
const API_KEY  = process.env.API_SECRET   ?? '';

// ─── Types ───────────────────────────────────

export interface InterviewRow {
  id:                 string;
  candidateId:        string;
  candidateName:      string;
  candidateEmail:     string;
  botId:              string;
  meetUrl:            string;
  scheduledAt:        string;
  startedAt?:         string;
  endedAt?:           string;
  status:             string;
  stage:              string;
  calendlyInviteeUri: string;
  questionsAsked:     string[];
  conversationHistory: Array<{ role: string; content: string }>;
  cancelReason?:      string;
  rescheduledToUri?:  string;
  createdAt?:         string;
  // jobRubric is null in API responses — position is on the scores row
  jobRubric:          { position: string } | null;
}

export interface ScoreRow {
  scores:         Record<string, { score: number; evidence: string }>;
  totalScore:     number;
  recommendation: 'ADVANCE' | 'REVIEW' | 'DO_NOT_ADVANCE';
  strengths:      string[];
  concerns:       string[];
  summary:        string;
}

export interface TranscriptEntry {
  speaker:   'AI Interviewer' | 'Candidate';
  text:      string;
  timestamp: string;
}

export interface CombinedInterview extends InterviewRow {
  score?: ScoreRow;
  position?: string;
}

// ─── Fetch wrapper ────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    API_KEY,
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API ${res.status} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── API calls ────────────────────────────────

export const getInterviews  = ()      => apiFetch<InterviewRow[]>('/interviews');
export const getInterview   = (id: string) => apiFetch<InterviewRow>(`/interviews/${id}`);
export const getScore       = (id: string) => apiFetch<ScoreRow>(`/interviews/${id}/score`);
export const getTranscript  = (id: string) => apiFetch<TranscriptEntry[]>(`/interviews/${id}/transcript`);

export async function recordDecision(
  interviewId: string,
  decision: 'approved' | 'rejected',
  decidedBy: string
): Promise<void> {
  await apiFetch(`/interviews/${interviewId}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, decided_by: decidedBy }),
  });
}

// ─── Helpers ─────────────────────────────────

export function recLabel(rec?: string): string {
  if (rec === 'ADVANCE')         return 'Advance';
  if (rec === 'REVIEW')          return 'Review';
  if (rec === 'DO_NOT_ADVANCE')  return 'Do Not Advance';
  return '—';
}

export function recColor(rec?: string): string {
  if (rec === 'ADVANCE')        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
  if (rec === 'REVIEW')         return 'text-amber-400  bg-amber-400/10  border-amber-400/30';
  if (rec === 'DO_NOT_ADVANCE') return 'text-red-400    bg-red-400/10    border-red-400/30';
  return 'text-ink-muted bg-surface-2 border-edge';
}

export function decisionColor(decision?: string): string {
  if (decision === 'approved') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
  if (decision === 'rejected') return 'text-red-400    bg-red-400/10    border-red-400/30';
  return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
}

export function statusColor(status: string): string {
  if (status === 'complete')   return 'text-emerald-400';
  if (status === 'in_progress' || status === 'evaluating') return 'text-brand';
  if (status === 'canceled')   return 'text-ink-faint';
  if (status === 'failed')     return 'text-red-400';
  return 'text-ink-muted';
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
