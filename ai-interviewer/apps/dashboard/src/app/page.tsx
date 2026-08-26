import Link from 'next/link';
import {
  getInterviews,
  getScore,
  recLabel,
  recColor,
  decisionColor,
  statusColor,
  formatDate,
  type InterviewRow,
  type ScoreRow,
} from '@/lib/api';

// ─────────────────────────────────────────────
// Load all interviews + their scores in parallel
// ─────────────────────────────────────────────

interface EnrichedInterview extends InterviewRow {
  score?: ScoreRow & { humanDecision?: string };
  position?: string;
}

async function loadDashboard(): Promise<EnrichedInterview[]> {
  const interviews = await getInterviews();

  // Fetch scores for all completed interviews in parallel
  const enriched = await Promise.all(
    interviews.map(async (iv) => {
      if (iv.status !== 'complete') return { ...iv };
      try {
        const score = await getScore(iv.id);
        return { ...iv, score };
      } catch {
        return { ...iv };
      }
    })
  );

  // Sort: pending decisions first, then by date desc
  return enriched.sort((a, b) => {
    const aDecision = (a.score as any)?.humanDecision ?? 'pending';
    const bDecision = (b.score as any)?.humanDecision ?? 'pending';
    if (aDecision === 'pending' && bDecision !== 'pending') return -1;
    if (aDecision !== 'pending' && bDecision === 'pending') return  1;
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });
}

// ─────────────────────────────────────────────
// Stats tile
// ─────────────────────────────────────────────

function StatTile({
  value,
  label,
  color = 'text-brand',
}: {
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface-1 p-5">
      <div className={`font-mono text-3xl font-semibold tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pill badge
// ─────────────────────────────────────────────

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function HomePage() {
  let interviews: EnrichedInterview[] = [];
  let loadError: string | null = null;

  try {
    interviews = await loadDashboard();
  } catch (err: any) {
    loadError = err?.message ?? 'Failed to load interviews';
  }

  // ── Compute stats ──
  const total      = interviews.length;
  const complete   = interviews.filter(iv => iv.status === 'complete').length;
  const pending    = interviews.filter(iv => iv.status === 'complete' && !(iv.score as any)?.humanDecision?.match(/approved|rejected/)).length;
  const advances   = interviews.filter(iv => iv.score?.recommendation === 'ADVANCE').length;
  const inProgress = interviews.filter(iv => ['in_progress', 'evaluating', 'scheduled'].includes(iv.status)).length;

  return (
    <div className="space-y-8">

      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Interview Queue</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Review AI-screened candidates and record your hiring decision.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile value={total}      label="Total interviews" />
        <StatTile value={pending}    label="Pending decision"  color="text-amber-400" />
        <StatTile value={advances}   label="AI recommended advance" color="text-emerald-400" />
        <StatTile value={inProgress} label="In progress"       color="text-brand" />
      </div>

      {/* ── Error state ── */}
      {loadError && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-6 text-sm text-red-400">
          <strong>Could not load interviews.</strong>
          <br />
          {loadError}
          <br />
          <span className="text-ink-muted">Make sure the API server is running on port 3000 and API_SECRET matches.</span>
        </div>
      )}

      {/* ── Interview table ── */}
      {!loadError && (
        <div className="overflow-hidden rounded-xl border border-edge bg-surface-1">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-surface-2 text-left">
                  <th className="px-5 py-3 font-medium text-ink-muted">Candidate</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">Position</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">Date</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">Status</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">Score</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">AI Rec.</th>
                  <th className="px-5 py-3 font-medium text-ink-muted">Decision</th>
                  <th className="px-5 py-3 font-medium text-ink-muted"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {interviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-ink-muted">
                      No interviews yet. Candidates will appear here after booking via Calendly.
                    </td>
                  </tr>
                ) : (
                  interviews.map((iv) => {
                    const score     = iv.score;
                    const decision  = (score as any)?.humanDecision;
                    const isPending = iv.status === 'complete' && (!decision || decision === 'pending');
                    const position  = iv.jobRubric?.position ?? '—';

                    return (
                      <tr key={iv.id} className="group transition hover:bg-surface-2/60">
                        <td className="px-5 py-4">
                          <div className="font-medium text-ink">{iv.candidateName}</div>
                          <div className="mt-0.5 text-xs text-ink-muted">{iv.candidateEmail}</div>
                        </td>
                        <td className="px-5 py-4 text-ink-muted">{position}</td>
                        <td className="px-5 py-4 font-mono text-xs text-ink-muted">
                          {formatDate(iv.startedAt ?? iv.scheduledAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-mono text-xs ${statusColor(iv.status)}`}>
                            {iv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {score ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                                {score.totalScore}
                              </span>
                              <span className="text-xs text-ink-faint">/100</span>
                              {/* Mini score bar */}
                              <div className="h-1 w-12 rounded-full bg-surface-3">
                                <div
                                  className="h-1 rounded-full bg-brand"
                                  style={{ width: `${score.totalScore}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {score?.recommendation ? (
                            <Pill label={recLabel(score.recommendation)} className={recColor(score.recommendation)} />
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {decision && decision !== 'pending' ? (
                            <Pill label={decision} className={decisionColor(decision)} />
                          ) : isPending ? (
                            <Pill label="pending" className="text-amber-400 bg-amber-400/10 border-amber-400/30" />
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {iv.status === 'complete' && (
                            <Link
                              href={`/interviews/${iv.id}`}
                              className="rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand/40 hover:text-brand"
                            >
                              Review →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty guidance ── */}
      {!loadError && interviews.length === 0 && (
        <div className="rounded-xl border border-edge bg-surface-1 p-8 text-center">
          <div className="text-3xl">📋</div>
          <h3 className="mt-3 font-medium text-ink">No interviews yet</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Interviews appear here automatically after a candidate books via Calendly
            and their AI screening is complete.
          </p>
          <div className="mt-4 font-mono text-xs text-ink-faint">
            Quick test: npx ts-node test/auto-run.ts
          </div>
        </div>
      )}
    </div>
  );
}
