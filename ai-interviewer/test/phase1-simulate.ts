// ─────────────────────────────────────────────
// Phase 1 — Interview Brain Simulator
//
// Runs the full interview flow in the terminal.
// No Google Meet, no Recall.ai, no Google Sheets.
// Only needs: ANTHROPIC_API_KEY in .env
//
// Usage:
//   npx ts-node test/phase1-simulate.ts
// ─────────────────────────────────────────────

import "dotenv/config";
import * as readline from "readline";
import { getOpeningScript, handleInterviewerResponse } from "../agents/interviewer";
import { InterviewSession, JobRubric } from "../types";

// ─── Hardcoded test rubric — no Google Sheets needed ───

const TEST_RUBRIC: JobRubric = {
  position: "Sales Representative",
  minimumRequirements: [
    "Available Monday–Friday, 9am–6pm",
    "Has own laptop or desktop computer",
    "Reliable internet connection",
    "Conversational English communication"
  ],
  competencies: [
    { name: "Communication",        key: "communication",     weight: 20, maxScore: 20, description: "Clear, confident, professional verbal communication" },
    { name: "Sales Experience",     key: "sales_experience",  weight: 25, maxScore: 25, description: "Prior sales or customer-facing experience" },
    { name: "Objection Handling",   key: "objection_handling",weight: 20, maxScore: 20, description: "Ability to handle pushback and objections" },
    { name: "Problem Solving",      key: "problem_solving",   weight: 15, maxScore: 15, description: "Logical thinking, adaptability" },
    { name: "Experience",           key: "experience",        weight: 10, maxScore: 10, description: "Relevant background and career trajectory" },
    { name: "Availability",         key: "availability",      weight: 10, maxScore: 10, description: "Meets schedule and equipment requirements" }
  ],
  advanceThreshold: 80,
  reviewThreshold:  65,
  standardQuestions: [
    "Tell me briefly about yourself and what interested you in this role.",
    "Are you available Monday through Friday, 9am to 6pm?",
    "Do you have your own computer and reliable internet?",
    "How many years of sales or customer-facing experience do you have?",
    "Tell me about a time when a customer said no and how you handled it.",
    "What motivates you to stay consistent in a sales role?"
  ],
  roleSpecificQuestions: [
    "Walk me through your typical process from first contact to closed deal.",
    "What was your quota in your last role, and how often did you hit it?",
    "How do you handle a prospect who goes cold after an initial conversation?"
  ]
};

// ─── Fake session — simulates what would be in Google Sheets ───

function createFakeSession(candidateName: string): InterviewSession {
  return {
    id:                  "test-session-001",
    candidateId:         "test-candidate-001",
    candidateName,
    candidateEmail:      "candidate@test.com",
    jobRubric:           TEST_RUBRIC,
    botId:               "test-bot-001",
    meetUrl:             "https://meet.google.com/test",
    scheduledAt:         new Date().toISOString(),
    startedAt:           new Date().toISOString(),
    status:              "in_progress",
    stage:               "consent",
    calendlyInviteeUri:  "https://api.calendly.com/test",
    transcript:          [],
    conversationHistory: [],
    questionsAsked:      []
  };
}

// ─── Terminal colors ───

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  gray:   "\x1b[90m"
};

// ─── Main simulation ───

async function runSimulation(): Promise<void> {
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout
  });

  const ask = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  console.clear();
  console.log(`${C.bold}╔══════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║     AI INTERVIEWER — Phase 1 Simulator  ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.gray}Type your answers and press Enter. Type 'quit' to exit.${C.reset}\n`);

  const name = await ask(`${C.yellow}Your name for this test: ${C.reset}`);
  const session = createFakeSession(name.trim() || "Test Candidate");

  // Opening script (hardcoded — no Claude call)
  const opening = getOpeningScript(session.candidateName, TEST_RUBRIC.position);
  session.conversationHistory.push({ role: "assistant", content: opening });

  console.log(`\n${C.cyan}${C.bold}[AI Interviewer]${C.reset}`);
  console.log(`${C.cyan}${opening}${C.reset}\n`);

  let turnCount = 0;
  const MAX_TURNS = 20;

  while (turnCount < MAX_TURNS) {
    const answer = await ask(`${C.green}${C.bold}[You] ${C.reset}`);

    if (answer.toLowerCase() === "quit") {
      console.log(`\n${C.gray}Simulation ended.${C.reset}`);
      break;
    }

    if (!answer.trim()) continue;

    console.log(`${C.gray}  [Claude thinking...]${C.reset}`);

    try {
      const { speech, shouldEnd, newStage } =
        await handleInterviewerResponse(session, answer.trim());

      if (newStage) {
        console.log(`\n${C.gray}  ── Stage: ${session.stage} → ${newStage} ──${C.reset}`);
        session.stage = newStage;
      }

      console.log(`\n${C.cyan}${C.bold}[AI Interviewer]${C.reset}`);
      console.log(`${C.cyan}${speech}${C.reset}\n`);

      if (shouldEnd) {
        console.log(`\n${C.bold}╔══════════════════════════════════════════╗${C.reset}`);
        console.log(`${C.bold}║           INTERVIEW COMPLETE             ║${C.reset}`);
        console.log(`${C.bold}╚══════════════════════════════════════════╝${C.reset}`);

        console.log(`\n${C.gray}Full conversation history (${session.conversationHistory.length} turns):${C.reset}`);
        for (const msg of session.conversationHistory) {
          const label = msg.role === "assistant"
            ? `${C.cyan}AI:  ${C.reset}`
            : `${C.green}You: ${C.reset}`;
          console.log(`${label}${msg.content.substring(0, 80)}...`);
        }

        console.log(`\n${C.yellow}Next step: run evaluation agent against this transcript.${C.reset}`);
        break;
      }

    } catch (err: any) {
      if (err.message?.includes("API key")) {
        console.log(`\n${C.yellow}⚠ No ANTHROPIC_API_KEY found in .env${C.reset}`);
        console.log(`${C.gray}Add your key to .env and try again:${C.reset}`);
        console.log(`  ANTHROPIC_API_KEY=sk-ant-...`);
        break;
      }
      console.error(`\nError: ${err.message}`);
    }

    turnCount++;
  }

  rl.close();
}

runSimulation().catch(console.error);
