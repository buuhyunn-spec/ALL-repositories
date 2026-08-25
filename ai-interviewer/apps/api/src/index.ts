import "dotenv/config";
import express from "express";
import recallWebhook from "../../../webhooks/recall";
import calendlyWebhook from "../../../webhooks/calendly";
import { apiRoutes } from "./routes";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

app.use(express.json());

// ─────────────────────────────────────────────
// Webhooks (public — verified by signature)
// ─────────────────────────────────────────────

app.use(recallWebhook);
app.use(calendlyWebhook);

// ─────────────────────────────────────────────
// API routes (internal — protected by API_SECRET)
// ─────────────────────────────────────────────

app.use("/api", apiRoutes);

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
  console.log(`[server] Webhook base: ${process.env.WEBHOOK_BASE_URL}`);
});
