import { readSheet, appendRow, updateRow, safeParseJSON, SheetRow } from "./base";
import { TABS } from "./client";
import { InterviewSession } from "../types";

// Tab columns (row 1 of interviews tab):
// id | candidate_id | candidate_name | candidate_email | position
// bot_id | meet_url | scheduled_at | started_at | ended_at
// status | stage | calendly_invitee_uri | questions_asked
// conversation_history | cancel_reason | rescheduled_to_uri | created_at

export async function createInterviewSession(
  session: Omit<InterviewSession, "id">
): Promise<InterviewSession> {
  const id = await appendRow(TABS.interviews, {
    candidate_id:         session.candidateId,
    candidate_name:       session.candidateName,
    candidate_email:      session.candidateEmail,
    position:             session.jobRubric.position,
    bot_id:               session.botId,
    meet_url:             session.meetUrl,
    scheduled_at:         session.scheduledAt,
    started_at:           "",
    ended_at:             "",
    status:               session.status,
    stage:                session.stage,
    calendly_invitee_uri: session.calendlyInviteeUri,
    questions_asked:      JSON.stringify([]),
    conversation_history: JSON.stringify([]),
    cancel_reason:        "",
    rescheduled_to_uri:   "",
    created_at:           new Date().toISOString()
  });

  return { id, ...session };
}

export async function getSessionByBotId(
  botId: string
): Promise<InterviewSession | null> {
  const rows = await readSheet(TABS.interviews);
  const row = rows.find(r => r.bot_id === botId);
  return row ? rowToSession(row) : null;
}

export async function getSessionByCalendlyUri(
  uri: string
): Promise<InterviewSession | null> {
  const rows = await readSheet(TABS.interviews);
  const row = rows.find(r => r.calendly_invitee_uri === uri);
  return row ? rowToSession(row) : null;
}

export async function getSessionById(
  id: string
): Promise<InterviewSession | null> {
  const rows = await readSheet(TABS.interviews);
  const row = rows.find(r => r.id === id);
  return row ? rowToSession(row) : null;
}

export async function getAllSessions(): Promise<InterviewSession[]> {
  const rows = await readSheet(TABS.interviews);
  return rows.map(rowToSession);
}

export async function saveSession(
  session: InterviewSession
): Promise<void> {
  const rows = await readSheet(TABS.interviews);
  const row = rows.find(r => r.id === session.id);
  if (!row) throw new Error(`Session not found: ${session.id}`);

  await updateRow(TABS.interviews, row._rowIndex, {
    id:                   session.id,
    candidate_id:         session.candidateId,
    candidate_name:       session.candidateName,
    candidate_email:      session.candidateEmail,
    position:             session.jobRubric?.position ?? row.position,
    bot_id:               session.botId,
    meet_url:             session.meetUrl,
    scheduled_at:         session.scheduledAt,
    started_at:           session.startedAt ?? "",
    ended_at:             session.endedAt ?? "",
    status:               session.status,
    stage:                session.stage,
    calendly_invitee_uri: session.calendlyInviteeUri,
    questions_asked:      JSON.stringify(session.questionsAsked),
    conversation_history: JSON.stringify(session.conversationHistory),
    cancel_reason:        session.cancelReason ?? "",
    rescheduled_to_uri:   session.rescheduledToUri ?? "",
    created_at:           session.createdAt ?? ""
  });
}

export async function cancelSession(
  id: string,
  meta: {
    canceledAt: string;
    cancelReason: string;
    rescheduledToUri?: string;
  }
): Promise<void> {
  const rows = await readSheet(TABS.interviews);
  const row = rows.find(r => r.id === id);
  if (!row) return;

  await updateRow(TABS.interviews, row._rowIndex, {
    ...row,
    status:             "canceled",
    ended_at:           meta.canceledAt,
    cancel_reason:      meta.cancelReason,
    rescheduled_to_uri: meta.rescheduledToUri ?? ""
  });
}

function rowToSession(row: SheetRow): InterviewSession {
  return {
    id:                  row.id,
    candidateId:         row.candidate_id,
    candidateName:       row.candidate_name,
    candidateEmail:      row.candidate_email,
    botId:               row.bot_id,
    meetUrl:             row.meet_url,
    scheduledAt:         row.scheduled_at,
    startedAt:           row.started_at || undefined,
    endedAt:             row.ended_at || undefined,
    status:              row.status,
    stage:               row.stage,
    calendlyInviteeUri:  row.calendly_invitee_uri,
    questionsAsked:      safeParseJSON<string[]>(row.questions_asked, []),
    conversationHistory: safeParseJSON(row.conversation_history, []),
    transcript:          [],        // loaded separately from transcript tab
    jobRubric:           null as any, // loaded separately from jobs tab
    cancelReason:        row.cancel_reason || undefined,
    rescheduledToUri:    row.rescheduled_to_uri || undefined,
    createdAt:           row.created_at
  };
}
