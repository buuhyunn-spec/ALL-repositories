import express from "express";
import { getAllCandidates, getCandidateById, createCandidate } from "../../../database/candidates";
import { getAllSessions, getSessionById } from "../../../database/interviews";
import { getTranscriptByInterviewId } from "../../../database/transcript";
import { getScoreByInterviewId, recordHumanDecision } from "../../../database/scores";
import { getAllJobRubrics } from "../../../database/jobs";

export const apiRoutes = express.Router();

// ─────────────────────────────────────────────
// Simple API key guard for internal dashboard use
// ─────────────────────────────────────────────

function requireApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const key = req.headers["x-api-key"];
  if (key !== process.env.API_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

apiRoutes.use(requireApiKey);

// ─────────────────────────────────────────────
// Candidates
// ─────────────────────────────────────────────

apiRoutes.get("/candidates", async (_req, res) => {
  const candidates = await getAllCandidates();
  res.json(candidates);
});

apiRoutes.get("/candidates/:id", async (req, res) => {
  const candidate = await getCandidateById(req.params.id);
  if (!candidate) return res.status(404).json({ error: "Not found" });
  res.json(candidate);
});

apiRoutes.post("/candidates", async (req, res) => {
  const candidate = await createCandidate(req.body);
  res.status(201).json(candidate);
});

// ─────────────────────────────────────────────
// Interviews
// ─────────────────────────────────────────────

apiRoutes.get("/interviews", async (_req, res) => {
  const sessions = await getAllSessions();
  res.json(sessions);
});

apiRoutes.get("/interviews/:id", async (req, res) => {
  const session = await getSessionById(req.params.id);
  if (!session) return res.status(404).json({ error: "Not found" });
  res.json(session);
});

apiRoutes.get("/interviews/:id/transcript", async (req, res) => {
  const transcript = await getTranscriptByInterviewId(req.params.id);
  res.json(transcript);
});

apiRoutes.get("/interviews/:id/score", async (req, res) => {
  const score = await getScoreByInterviewId(req.params.id);
  if (!score) return res.status(404).json({ error: "Score not found" });
  res.json(score);
});

// ─────────────────────────────────────────────
// Human approval decision
// ─────────────────────────────────────────────

apiRoutes.post("/interviews/:id/decision", async (req, res) => {
  const { decision, decided_by } = req.body as {
    decision: "approved" | "rejected";
    decided_by: string;
  };

  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ error: "decision must be approved or rejected" });
  }

  await recordHumanDecision(req.params.id, decision, decided_by);
  res.json({ success: true, decision });
});

// ─────────────────────────────────────────────
// Job rubrics
// ─────────────────────────────────────────────

apiRoutes.get("/jobs", async (_req, res) => {
  const rubrics = await getAllJobRubrics();
  res.json(rubrics);
});
