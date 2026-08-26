import Link from 'next/link';
import { notFound } from 'next/navigation';
import DecisionButtons from '@/components/DecisionButtons';
import {
  getInterview,
  getScore,
  getTranscript,
  recLabel,
  recColor,
  decisionColor,
  formatDate,
  formatTime,
  type TranscriptEntry,
  type ScoreRow,
} from '@/lib/api';

// ─────────────────────────────────────────────
// Score bar component
// ─────────────────────────────────────────────

function ScoreBar({
  name,
  score,
  max,
  evidence,
}: {
  name: string;
  score: number;
  max: number;
  evidence: string;
}) {
  const pct = Math.round((score / max) * 100);
  const barColor =
    pct >= 75 ? 'bg-emerald-400' : pct >= 50 ? 'bg-brand' : pct >= 25 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{name}</span>
        <span className="font-mono text-sm tabular-nums text-ink-muted">
          {score}<span className="text-ink-faint">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-1.5 rounded-full ${barColor} score-bar-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {evidence && (
        <p className="text-xs leading-relaxed text-ink-muted">{evidence}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Transcript bubble
// ─────────────────────────────────────────────

function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
  const isAI = entry.speaker === 'AI Interviewer';
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          isAI ? 'bg-brand/20 text-brand' : 'bg-surface-3 text-ink-muted'
        }`}
      >
        {isAI ? 'AI' : 'C'}
      </div>
      {/* Bubble */}
      <div className={`max-w-[82%] space-y-1 ${isAI ? '' : 'items-end'}`}>
        <div
          className={`flex items-center gap-2 ${isAI ? '' : 'flex-row-reverse'}`}
        >
          <span className={`text-xs font-medium ${isAI ? 'text-brand' : 'text-ink-muted'}`}>
            {isAI ? 'AI Interviewer' : 'Candidate'}
          </span>
          <span className="font-mono text-[10px] text-ink-faint">
            {formatTime(entry.timestamp)}
          </span>
        </div>
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            isAI
              ? 'bg-surface-2 text-ink'
              : 'bg-surface-3 text-ink'
          }`}
        >
          {entry.text}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Score summary sidebar
// ─────────────────────────────────────────────

function ScoreSidebar({
  score,
  interviewId,
  humanDecision,
}: {
  score: ScoreRow;
  interviewId: string;
  humanDecision?: string;
}) {
  const isPending = !humanDecision || humanDecision === 'pending';

  // Build ordered competency list from score keys
  const competencies = Object.entries(score.scores);

  return (
    <div className="space-y-5">

      {/* ── Score hero ── */}
      <div className="rounded-xl border border-edge bg-surface-1 p-5 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums text-ink">
          {score.totalScore}
          <span className="ml-1 text-2xl text-ink-faint">/100</span>
        </div>
        <div className="mt-3 flex justify-center">
          <span className={`rounded border px-3 py-1 font-mono text-xs font-semibold ${recColor(score.recommendation)}`}>
            {recLabel(score.recommendation)}
          </span>
        </div>
        {score.summary && (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{score.summary}</p>
        )}
      </div>

      {/* ── Competency scores ── */}
      <div className="rounded-xl border border-edge bg-surface-1 p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Competency Scores
        </h3>
        <div className="space-y-5">
          {competencies.map(([key, val]) => (
            <ScoreBar
              key={key}
              name={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              score={val.score}
              max={25} // max varies; we use 25 as default and show raw score
              evidence={val.evidence}
            />
          ))}
        </div>
      </div>

      {/* ── Strengths ── */}
      {score.strengths?.length > 0 && (
        <div className="rounded-xl border border-edge bg-surface-1 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Strengths
          </h3>
          <ul className="space-y-2">
            {score.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="mt-0.5 text-emerald-400">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Concerns ── */}
      {score.concerns?.length > 0 && (
        <div className="rounded-xl border border-edge bg-surface-1 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Concerns
          </h3>
          <ul className="space-y-2">
            {score.concerns.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="mt-0.5 text-amber-400">⚠</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Decision ── */}
      <div className="rounded-xl border border-edge bg-surface-1 p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Recruiter Decision
        </h3>
        {isPending ? (
          <DecisionButtons interviewId={interviewId} />
        ) : (
          <div className="text-center">
            <span className={`rounded border px-4 py-1.5 font-mono text-sm font-semibold capitalize ${decisionColor(humanDecision)}`}>
              {humanDecision}
            </span>
            <p className="mt-2 text-xs text-ink-muted">Decision recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function InterviewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  let interview, score, transcript;
  try {
    [interview, score, transcript] = await Promise.all([
      getInterview(id),
      getScore(id).catch(() => null),
      getTranscript(id).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  const position     = interview.jobRubric?.position ?? '—';
  const humanDecision = (score as any)?.humanDecision as string | undefined;

  return (
    <div className="space-y-6">

      {/* ── Back + header ── */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          ← Back to queue
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{interview.candidateName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <span>{interview.candidateEmail}</span>
              <span className="text-edge">·</span>
              <span>{position}</span>
              <span className="text-edge">·</span>
              <span>{formatDate(interview.startedAt ?? interview.scheduledAt)}</span>
            </div>
          </div>

          {score && (
            <div className="flex items-center gap-2">
              <span className={`rounded border px-3 py-1 font-mono text-xs font-semibold ${recColor(score.recommendation)}`}>
                {recLabel(score.recommendation)}
              </span>
              <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
                {score.totalScore}<span className="text-base text-ink-faint">/100</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* ── Transcript ── */}
        <div className="rounded-xl border border-edge bg-surface-1">
          <div className="border-b border-edge px-5 py-3">
            <h2 className="text-sm font-semibold text-ink">
              Interview Transcript
              <span className="ml-2 font-mono text-xs font-normal text-ink-muted">
                ({transcript.length} messages)
              </span>
            </h2>
          </div>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
            {transcript.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">
                No transcript available.
              </p>
            ) : (
              transcript.map((entry, i) => (
                <TranscriptBubble key={i} entry={entry} />
              ))
            )}
          </div>
        </div>

        {/* ── Score sidebar ── */}
        <div>
          {score ? (
            <ScoreSidebar
              score={score}
              interviewId={id}
              humanDecision={humanDecision}
            />
          ) : (
            <div className="rounded-xl border border-edge bg-surface-1 p-8 text-center text-sm text-ink-muted">
              Evaluation not available yet.
              <br />
              Status: <span className="font-mono text-brand">{interview.status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
