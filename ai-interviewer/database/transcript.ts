import { readSheet, appendRow } from "./base";
import { TABS } from "./client";
import { TranscriptEntry } from "../types";

// Separate tab — one row per spoken line
// Avoids Google Sheets 50,000 char cell limit on interviews tab
//
// Tab columns:
// id | interview_id | speaker | text | timestamp

export async function appendTranscriptEntry(
  interviewId: string,
  entry: TranscriptEntry
): Promise<void> {
  await appendRow(TABS.transcript, {
    interview_id: interviewId,
    speaker:      entry.speaker,
    text:         entry.text,
    timestamp:    entry.timestamp
  });
}

export async function getTranscriptByInterviewId(
  interviewId: string
): Promise<TranscriptEntry[]> {
  const rows = await readSheet(TABS.transcript);
  return rows
    .filter(r => r.interview_id === interviewId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(r => ({
      speaker:   r.speaker as TranscriptEntry["speaker"],
      text:      r.text,
      timestamp: r.timestamp
    }));
}
