// ─────────────────────────────────────────────
// Seed job rubrics into the jobs tab
// Run once: npx ts-node database/seed-jobs.ts
// ─────────────────────────────────────────────

import "dotenv/config";
import { appendRow } from "./base";
import { TABS } from "./client";

const SALES_REP_RUBRIC = {
  position: "Sales Representative",
  min_requirements: JSON.stringify([
    "Available Monday–Friday, 9am–6pm",
    "Has own laptop or desktop computer",
    "Reliable internet connection",
    "Conversational English communication",
    "Willing to work on commission + base"
  ]),
  competencies: JSON.stringify([
    {
      name: "Communication",
      key: "communication",
      weight: 20,
      maxScore: 20,
      description: "Clear, confident, professional verbal communication"
    },
    {
      name: "Sales Experience",
      key: "sales_experience",
      weight: 25,
      maxScore: 25,
      description: "Prior sales or customer-facing experience with measurable results"
    },
    {
      name: "Objection Handling",
      key: "objection_handling",
      weight: 20,
      maxScore: 20,
      description: "Ability to handle pushback and turn objections into opportunities"
    },
    {
      name: "Problem Solving",
      key: "problem_solving",
      weight: 15,
      maxScore: 15,
      description: "Logical thinking, adaptability, handles difficult situations well"
    },
    {
      name: "Experience & Background",
      key: "experience",
      weight: 10,
      maxScore: 10,
      description: "Relevant industry knowledge and career trajectory"
    },
    {
      name: "Availability & Requirements",
      key: "availability",
      weight: 10,
      maxScore: 10,
      description: "Meets all schedule, equipment, and role requirements"
    }
  ]),
  advance_threshold: 80,
  review_threshold:  65,
  standard_questions: JSON.stringify([
    "Tell me briefly about yourself and what interested you in this role.",
    "Are you available Monday through Friday, 9am to 6pm?",
    "Do you have your own computer and reliable internet?",
    "How many years of sales or customer-facing experience do you have?",
    "Tell me about a time when a customer said no and how you handled it.",
    "What motivates you to stay consistent in a sales role?",
    "How do you typically handle rejection in sales?"
  ]),
  role_specific_questions: JSON.stringify([
    "Walk me through your typical process from first contact to closed deal.",
    "What sales tools or CRMs have you used?",
    "What was your quota in your last role, and how often did you hit it?",
    "Describe your approach when a prospect goes cold after an initial conversation.",
    "How do you prioritize your pipeline when you have too many leads to work?"
  ]),
  active: "true"
};

async function seedJobs() {
  console.log("Seeding job rubrics...");

  await appendRow(TABS.jobs, SALES_REP_RUBRIC);
  console.log("✅ Sales Representative rubric added");

  console.log("Done. Check your Google Sheet's jobs tab.");
}

seedJobs().catch(console.error);
