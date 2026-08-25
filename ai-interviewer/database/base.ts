import { getSheets, SPREADSHEET_ID } from "./client";
import { v4 as uuid } from "uuid";

export type SheetRow = Record<string, any> & { _rowIndex: number };

// ─────────────────────────────────────────────
// Read all rows from a tab
// Returns array of objects keyed by header row
// ─────────────────────────────────────────────

export async function readSheet(tab: string): Promise<SheetRow[]> {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: tab
  });

  const rows = res.data.values ?? [];
  if (rows.length === 0) return [];

  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map((row, index) => {
    const obj: SheetRow = { _rowIndex: index + 2 }; // +2: 1-indexed + header row
    headers.forEach((header, i) => {
      obj[header] = (row as string[])[i] ?? "";
    });
    return obj;
  });
}

// ─────────────────────────────────────────────
// Append a new row — returns the generated ID
// ─────────────────────────────────────────────

export async function appendRow(
  tab: string,
  data: Record<string, any>
): Promise<string> {
  const sheets = await getSheets();
  const headers = await getHeaders(tab);
  const id = data.id ?? uuid();

  const row = headers.map(h => {
    const value = h === "id" ? id : (data[h] ?? "");
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: tab,
    valueInputOption: "RAW",
    requestBody: { values: [row] }
  });

  return id;
}

// ─────────────────────────────────────────────
// Update a specific row by row index
// ─────────────────────────────────────────────

export async function updateRow(
  tab: string,
  rowIndex: number,
  data: Record<string, any>
): Promise<void> {
  const sheets = await getSheets();
  const headers = await getHeaders(tab);

  const row = headers.map(h => {
    const value = data[h] ?? "";
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] }
  });
}

// ─────────────────────────────────────────────
// Get headers from row 1
// ─────────────────────────────────────────────

async function getHeaders(tab: string): Promise<string[]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!1:1`
  });
  return ((res.data.values?.[0] ?? []) as string[]);
}

// ─────────────────────────────────────────────
// Safely parse JSON stored in a cell
// ─────────────────────────────────────────────

export function safeParseJSON<T>(value: string, fallback: T): T {
  if (!value || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
