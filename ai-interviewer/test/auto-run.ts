// Auto-run test — simulates a full interview automatically
// No keyboard input needed — runs straight through

import "dotenv/config";
import { getOpeningScript, handleInterviewerResponse } from "../agents/interviewer";
import { evaluateInterview } from "../agents/evaluator";
import { InterviewSession, JobRubric, TranscriptEntry } from "../types";

const TEST_RUBRIC: JobRubric = {
  position: "Sales Representative",
  minimumRequirements: [
    "Available Monday–Friday, 9am–6pm",
    "Has own laptop or desktop",
    "Reliable internet connection"
  ],
  competencies: [
    { name: "Communication",      key: "communication",     weight: 20, maxScore: 20, description: "Clear, confident verbal communication" },
    { name: "Sales Experience",   key: "sales_experience",  weight: 25, maxScore: 25, description: "Prior sales or customer-facing experience" },
    { name: "Objection Handling", key: "objection_handling",weight: 20, maxScore: 20, description: "Handles pushback and objections well" },
    { name: "Problem Solving",    key: "problem_solving",   weight: 15, maxScore: 15, description: "Logical thinking, adaptability" },
    { name: "Experience",         key: "experience",        weight: 10, maxScore: 10, description: "Relevant background" },
    { name: "Availability",       key: "availability",      weight: 10, maxScore: 10, description: "Meets schedule requirements" }
  ],
  advanceThreshold: 80,
  reviewThreshold:  65,
  standardQuestions: [
    "Tell me briefly about yourself and what interested you in this role.",
    "Are you available Monday through Friday, 9am to 6pm?",
    "How many years of sales experience do you have?",
    "Tell me about a time a customer said no and how you handled it.",
  ],
  roleSpecificQuestions: [
    "What was your quota in your last role and how often did you hit it?",
    "Walk me through your process from first contact to closed deal."
  ]
};

// Simulated candidate answers — realistic Sales Rep applicant
const CANDIDATE_ANSWERS = [
  "Yes I'm comfortable proceeding.",
  "Yes I'm available those hours and I have my own laptop and good internet at home.",
  "I have about 3 years of sales experience. I worked at a BPO doing outbound sales for insurance products and before that I did retail sales.",
  "I usually stayed calm and tried to understand their concern first. One time a client said the price was too high so I offered a payment plan and explained the long term value. We ended up closing the deal.",
  "In my last role my monthly quota was 40 policies and I consistently hit around 45 to 50. I tracked everything on a spreadsheet and followed up religiously.",
  "I start with building rapport, then qualify their needs, present the product matching their situation, handle objections, and ask for the close. If they say not yet I schedule a follow up.",
  "I don't have questions right now, thank you."
];

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  gray:   "\x1b[90m",
  white:  "\x1b[97m"
};

function log(label: string, text: string, color: string) {
  console.log(`\n${color}${C.bold}${label}${C.reset}`);
  console.log(`${color}${text}${C.reset}`);
}

async function runAutoInterview() {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║    AI INTERVIEWER — Gemini Live Test Run     ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}\n`);

  const session: InterviewSession = {
    id:                  "test-001",
    candidateId:         "cand-001",
    candidateName:       "Maria Santos",
    candidateEmail:      "maria@test.com",
    jobRubric:           TEST_RUBRIC,
    botId:               "bot-001",
    meetUrl:             "https://meet.google.com/test",
    scheduledAt:         new Date().toISOString(),
    startedAt:           new Date().toISOString(),
    status:              "in_progress",
    stage:               "consent",
    calendlyInviteeUri:  "https://calendly.com/test",
    transcript:          [],
    conversationHistory: [],
    questionsAsked:      []
  };

  // Opening
  const opening = getOpeningScript(session.candidateName, TEST_RUBRIC.position);
  session.conversationHistory.push({ role: "assistant", content: opening });
  session.transcript.push({ speaker: "AI Interviewer", text: opening, timestamp: new Date().toISOString() });
  log("🤖 AI Interviewer:", opening, C.cyan);

  let answerIndex = 0;
  let turnCount = 0;

  while (turnCount < 15 && answerIndex < CANDIDATE_ANSWERS.length) {
    const answer = CANDIDATE_ANSWERS[answerIndex++];

    session.transcript.push({ speaker: "Candidate", text: answer, timestamp: new Date().toISOString() });
    log("👤 Maria Santos:", answer, C.green);

    console.log(`${C.gray}  [Gemini thinking...]${C.reset}`);

    try {
      const { speech, shouldEnd, newStage } =
        await handleInterviewerResponse(session, answer);

      if (newStage) {
        console.log(`\n${C.yellow}  ── Stage: ${session.stage} → ${newStage} ──${C.reset}`);
        session.stage = newStage;
      }

      session.transcript.push({ speaker: "AI Interviewer", text: speech, timestamp: new Date().toISOString() });
      log("🤖 AI Interviewer:", speech, C.cyan);

      if (shouldEnd) {
        console.log(`\n${C.yellow}${C.bold}  ── Interview ended ──${C.reset}\n`);
        break;
      }

    } catch (err: any) {
      console.error(`\n${C.yellow}Error: ${err.message}${C.reset}`);
      if (err.message?.includes("API_KEY") || err.message?.includes("API key") || err.message?.includes("401") || err.message?.includes("403")) {
        console.log(`\n${C.yellow}⚠ API key issue — check your GEMINI_API_KEY in .env${C.reset}`);
      }
      process.exit(1);
    }

    turnCount++;
    await new Promise(r => setTimeout(r, 500)); // small delay between turns
  }

  // ─── Run evaluation ───
  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║           RUNNING EVALUATION...              ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.gray}[Gemini scoring the transcript...]${C.reset}\n`);

  const transcriptText = session.transcript
    .map(e => `${e.speaker}: ${e.text}`)
    .join("\n");

  try {
    const result = await evaluateInterview(transcriptText, TEST_RUBRIC);

    console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}║              INTERVIEW REPORT                ║${C.reset}`);
    console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
    console.log(`\n${C.white}Candidate:      Maria Santos${C.reset}`);
    console.log(`${C.white}Position:       Sales Representative${C.reset}`);
    console.log(`${C.white}Total Score:    ${C.bold}${result.totalScore}/100${C.reset}`);

    const recColor = result.recommendation === "ADVANCE" ? C.green
      : result.recommendation === "REVIEW" ? C.yellow : "\x1b[31m";
    console.log(`${recColor}Recommendation: ${C.bold}${result.recommendation}${C.reset}`);

    console.log(`\n${C.white}${C.bold}COMPETENCY SCORES:${C.reset}`);
    for (const [key, val] of Object.entries(result.scores)) {
      const comp = TEST_RUBRIC.competencies.find(c => c.key === key);
      const name = comp?.name ?? key;
      console.log(`  ${name.padEnd(22)} ${val.score}/${comp?.maxScore ?? "?"}`);
      console.log(`  ${C.gray}Evidence: ${val.evidence.substring(0, 80)}${C.reset}`);
    }

    console.log(`\n${C.green}${C.bold}STRENGTHS:${C.reset}`);
    result.strengths.forEach(s => console.log(`  ${C.green}✓ ${s}${C.reset}`));

    console.log(`\n${C.yellow}${C.bold}CONCERNS:${C.reset}`);
    result.concerns.forEach(c => console.log(`  ${C.yellow}⚠ ${c}${C.reset}`));

    console.log(`\n${C.white}${C.bold}SUMMARY:${C.reset}`);
    console.log(`  ${result.summary}`);

    console.log(`\n${C.bold}✅ Gemini is working perfectly for the interview system!${C.reset}\n`);

  } catch (err: any) {
    console.error("Evaluation error:", err.message);
  }
}

runAutoInterview().catch(console.error);
