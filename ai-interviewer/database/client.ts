import { google, sheets_v4 } from "googleapis";
import path from "path";

let sheetsClient: sheets_v4.Sheets | null = null;

export async function getSheets(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_CREDENTIALS_PATH!),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!;

export const TABS = {
  candidates:  "candidates",
  interviews:  "interviews",
  transcript:  "transcript",
  scores:      "scores",
  jobs:        "jobs"
} as const;
