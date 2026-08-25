import { readSheet, appendRow, updateRow, SheetRow } from "./base";
import { TABS } from "./client";
import { Candidate } from "../types";

// Tab columns (row 1 of candidates tab):
// id | name | email | position | resume_url | status | created_at | notes

export async function getCandidateByEmail(
  email: string
): Promise<Candidate | null> {
  const rows = await readSheet(TABS.candidates);
  const row = rows.find(r => r.email?.toLowerCase() === email.toLowerCase());
  return row ? rowToCandidate(row) : null;
}

export async function getCandidateById(
  id: string
): Promise<Candidate | null> {
  const rows = await readSheet(TABS.candidates);
  const row = rows.find(r => r.id === id);
  return row ? rowToCandidate(row) : null;
}

export async function getAllCandidates(): Promise<Candidate[]> {
  const rows = await readSheet(TABS.candidates);
  return rows.map(rowToCandidate);
}

export async function createCandidate(
  candidate: Omit<Candidate, "id">
): Promise<Candidate> {
  const id = await appendRow(TABS.candidates, {
    name:       candidate.name,
    email:      candidate.email,
    position:   candidate.position,
    resume_url: candidate.resumeUrl,
    status:     candidate.status,
    notes:      candidate.notes ?? "",
    created_at: new Date().toISOString()
  });
  return { id, ...candidate };
}

export async function updateCandidateStatus(
  id: string,
  status: Candidate["status"]
): Promise<void> {
  const rows = await readSheet(TABS.candidates);
  const row = rows.find(r => r.id === id);
  if (!row) throw new Error(`Candidate not found: ${id}`);

  await updateRow(TABS.candidates, row._rowIndex, {
    ...row,
    status
  });
}

function rowToCandidate(row: SheetRow): Candidate {
  return {
    id:        row.id,
    name:      row.name,
    email:     row.email,
    position:  row.position,
    resumeUrl: row.resume_url,
    status:    row.status,
    notes:     row.notes,
    createdAt: row.created_at
  };
}
