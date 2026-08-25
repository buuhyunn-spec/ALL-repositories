import { RecallBot, ScheduleBotOptions, InterviewSession } from "../types";

const RECALL_BASE_URL = "https://us-east-1.recall.ai/api/v1";

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────

async function recallRequest<T>(
  method: "GET" | "POST" | "DELETE" | "PATCH",
  path: string,
  body?: object
): Promise<T> {
  const res = await fetch(`${RECALL_BASE_URL}${path}`, {
    method,
    headers: {
      "Authorization": `Token ${process.env.RECALL_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Recall ${method} ${path} → ${res.status}: ${error}`);
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Schedule a bot to join a Google Meet
// ─────────────────────────────────────────────

export async function scheduleRecallBot(
  options: ScheduleBotOptions
): Promise<RecallBot> {
  const { meetUrl, scheduledAt, botName, sessionId } = options;
  const webhookBase = process.env.WEBHOOK_BASE_URL!;

  const bot = await recallRequest<RecallBot>("POST", "/bot", {
    meeting_url: meetUrl,
    bot_name:    botName,
    join_at:     scheduledAt,

    // Real-time transcript → your server
    // partial_results: false = only finalized words (free tier strategy)
    real_time_transcription: {
      destination_url: `${webhookBase}/webhooks/recall`,
      partial_results: false
    },

    // Use Google Meet's built-in captions (free)
    // Switch to "assembly_ai" later for better accuracy
    recording_config: {
      transcript: {
        provider: { meeting_captions: {} }
      }
    },

    // Pass session ID — Recall sends it back in every webhook
    metadata: { session_id: sessionId },

    // Auto-leave rules — protect free tier minutes
    automatic_leave: {
      waiting_room_timeout:  300,  // leave if waiting 5 min
      noone_joined_timeout:  300,  // leave if alone 5 min
      everyone_left_timeout: 10    // leave 10s after candidate hangs up
    }
  });

  console.log(`[recall] Bot scheduled: ${bot.id} | join_at: ${scheduledAt}`);
  return bot;
}

// ─────────────────────────────────────────────
// Speaking queue — prevents audio overlap
// ─────────────────────────────────────────────

const speakingQueues = new Map<string, Promise<void>>();

export async function speakViaRecall(
  botId: string,
  text: string
): Promise<void> {
  const previous = speakingQueues.get(botId) ?? Promise.resolve();

  const next = previous.then(async () => {
    try {
      const audioBase64 = await generateSpeech(text);

      await recallRequest("POST", `/bot/${botId}/output_media`, {
        kind: "AudioFile",
        audio_data: { kind: "mp3", data: audioBase64 }
      });

      console.log(`[recall] Bot speaking: "${text.substring(0, 60)}..."`);

      // Wait estimated duration before queuing next response
      const words = text.split(" ").length;
      const durationMs = (words / 150) * 60 * 1000; // 150 wpm
      await sleep(durationMs + 500);

    } catch (err) {
      console.error(`[recall] speakViaRecall error [${botId}]:`, err);
    }
  });

  speakingQueues.set(botId, next);
  await next;
}

// ─────────────────────────────────────────────
// End the interview gracefully
// ─────────────────────────────────────────────

export async function endInterviewCall(
  botId: string,
  session: InterviewSession
): Promise<void> {
  await sleep(2000);
  await recallRequest("POST", `/bot/${botId}/leave_call`, {});
  console.log(`[recall] Bot left call: ${botId}`);
  speakingQueues.delete(botId);
}

// ─────────────────────────────────────────────
// Cancel a scheduled or active bot
// ─────────────────────────────────────────────

export async function cancelRecallBot(botId: string): Promise<void> {
  try {
    const bot = await getBotStatus(botId);

    if (["done", "fatal"].includes(bot.status)) {
      console.log(`[recall] Bot ${botId} already finished — no cancel needed`);
      return;
    }

    if (["in_call", "in_call_recording"].includes(bot.status)) {
      await recallRequest("POST", `/bot/${botId}/leave_call`, {});
      console.log(`[recall] Bot ${botId} left call`);
    }

    await recallRequest("DELETE", `/bot/${botId}`, undefined);
    console.log(`[recall] Bot ${botId} deleted`);

  } catch (err: any) {
    if (err.message?.includes("404")) {
      console.log(`[recall] Bot ${botId} already removed`);
      return;
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// Get bot status
// ─────────────────────────────────────────────

export async function getBotStatus(botId: string): Promise<RecallBot> {
  return recallRequest<RecallBot>("GET", `/bot/${botId}`);
}

// ─────────────────────────────────────────────
// TTS — Text to Speech via ElevenLabs
// Returns base64 encoded MP3
// ─────────────────────────────────────────────

async function generateSpeech(text: string): Promise<string> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID!;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key":   process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
        "Accept":       "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",   // fastest, lowest latency
        voice_settings: {
          stability:        0.75,
          similarity_boost: 0.75,
          speed:            0.9        // slightly slower = clearer
        }
      })
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
