// ─────────────────────────────────────────────
// Turn Buffer — Free tier strategy
//
// Instead of reacting to every transcript word,
// buffer until the candidate finishes their turn
// (silence gap), then send the complete answer
// to Claude once.
//
// WORD-BY-WORD (wasteful):
//   "I" → Claude, "managed" → Claude ...
//
// TURN-BASED (correct):
//   [2s silence] "I managed a team..." → Claude ✅
// ─────────────────────────────────────────────

const SILENCE_THRESHOLD_MS = 2000; // 2s of silence = candidate finished

interface TurnBuffer {
  words: string[];
  silenceTimer: ReturnType<typeof setTimeout> | null;
}

// One buffer per active bot
const buffers = new Map<string, TurnBuffer>();

type OnTurnComplete = (botId: string, answer: string) => Promise<void>;

// Register callback — called when candidate finishes speaking
let onTurnComplete: OnTurnComplete | null = null;

export function registerTurnCallback(fn: OnTurnComplete): void {
  onTurnComplete = fn;
}

// ─────────────────────────────────────────────
// Called on every Recall.ai transcript.data webhook
// ─────────────────────────────────────────────

export function handleTranscriptChunk(
  botId: string,
  data: {
    transcript: {
      speaker: string;
      words: Array<{ text: string; start_time: number }>;
    };
  }
): void {
  const { speaker, words } = data.transcript;

  // Only process candidate speech
  if (speaker === "AI Interviewer") return;
  if (!words || words.length === 0) return;

  // Get or create buffer
  if (!buffers.has(botId)) {
    buffers.set(botId, { words: [], silenceTimer: null });
  }

  const buffer = buffers.get(botId)!;

  // Add new words
  const newWords = words.map(w => w.text);
  buffer.words.push(...newWords);

  // Reset silence timer on every new word
  if (buffer.silenceTimer) {
    clearTimeout(buffer.silenceTimer);
  }

  buffer.silenceTimer = setTimeout(async () => {
    const completeAnswer = buffer.words.join(" ").trim();
    buffer.words = [];
    buffer.silenceTimer = null;

    if (completeAnswer.length > 0 && onTurnComplete) {
      await onTurnComplete(botId, completeAnswer).catch(err =>
        console.error(`Turn callback error [${botId}]:`, err)
      );
    }
  }, SILENCE_THRESHOLD_MS);
}

// ─────────────────────────────────────────────
// Clean up buffer when interview ends
// ─────────────────────────────────────────────

export function clearBuffer(botId: string): void {
  const buffer = buffers.get(botId);
  if (buffer?.silenceTimer) {
    clearTimeout(buffer.silenceTimer);
  }
  buffers.delete(botId);
}
