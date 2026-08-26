'use client';

import { useTransition } from 'react';
import { approveInterview, rejectInterview } from '@/actions/decision';

interface Props {
  interviewId: string;
}

export default function DecisionButtons({ interviewId }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(() => approveInterview(interviewId));
  }

  function handleReject() {
    startTransition(() => rejectInterview(interviewId));
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="flex-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-400/20 disabled:opacity-40"
      >
        {isPending ? '…' : '✓  Approve'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="flex-1 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-400/20 disabled:opacity-40"
      >
        {isPending ? '…' : '✕  Reject'}
      </button>
    </div>
  );
}
