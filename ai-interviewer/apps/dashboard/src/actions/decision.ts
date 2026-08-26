'use server';

import { revalidatePath } from 'next/cache';
import { recordDecision } from '@/lib/api';

export async function approveInterview(interviewId: string): Promise<void> {
  await recordDecision(interviewId, 'approved', 'Recruiter');
  revalidatePath('/');
  revalidatePath(`/interviews/${interviewId}`);
}

export async function rejectInterview(interviewId: string): Promise<void> {
  await recordDecision(interviewId, 'rejected', 'Recruiter');
  revalidatePath('/');
  revalidatePath(`/interviews/${interviewId}`);
}
