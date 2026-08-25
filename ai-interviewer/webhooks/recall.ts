import express from "express";
import crypto from "crypto";
import {
  handleBotJoined,
  handleCallEnded,
  handleBotError
} from "../interview/session-manager";
import { handleTranscriptChunk, registerTurnCallback } from "../interview/turn-buffer";
import { processCompleteAnswer } from "../interview/session-manager";

const router = express.Router();

// Register what happens when a candidate finishes speaking
registerTurnCallback(processCompleteAnswer);

// ─────────────────────────────────────────────
// Signature verification
// ─────────────────────────────────────────────

function verifyRecallSignature(req: express.Request): boolean {
  const signature = req.headers["x-recall-signature"] as string;
  if (!signature) return false;

  const secret = process.env.RECALL_WEBHOOK_SECRET!;
  const body = JSON.stringify(req.body);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return signature === `sha256=${expected}`;
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────

router.post("/webhooks/recall", async (req: express.Request, res: express.Response) => {
  // Always respond 200 immediately — Recall retries on timeout
  res.status(200).json({ received: true });

  if (!verifyRecallSignature(req)) {
    console.warn("[recall webhook] Invalid signature — ignored");
    return;
  }

  const { event, data } = req.body;
  const botId: string = data?.bot_id ?? data?.data?.bot_id;

  if (!botId) {
    console.warn("[recall webhook] No bot_id in payload");
    return;
  }

  console.log(`[recall webhook] ${event} | bot: ${botId}`);

  try {
    switch (event) {

      case "bot.in_call_recording":
        await handleBotJoined(botId);
        break;

      case "transcript.data":
        handleTranscriptChunk(botId, data);
        break;

      case "bot.done":
        await handleCallEnded(botId, data?.transcript);
        break;

      case "bot.fatal":
        await handleBotError(botId, data);
        break;

      // Informational — no action needed
      case "bot.joining_call":
      case "bot.in_waiting_room":
      case "bot.in_call_not_recording":
        console.log(`[recall webhook] Status update: ${event}`);
        break;

      default:
        console.log(`[recall webhook] Unhandled event: ${event}`);
    }
  } catch (err) {
    console.error(`[recall webhook] Error handling ${event}:`, err);
  }
});

export default router;
