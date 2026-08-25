# AI Interviewer — Claude Code Instructions

## What This Project Does
AI-powered initial screening interviews via Google Meet.
Calendly books → Recall.ai bot joins → Claude conducts interview → Scores saved to Google Sheets → Recruiter approves/rejects.

## Project Structure
```
types/          → All TypeScript types (single source of truth)
database/       → Google Sheets CRUD (candidates, interviews, transcript, scores, jobs)
interview/      → State machine, turn buffer, scoring, safeguards, session manager
agents/         → Claude SDK agents (interviewer, evaluator, report-generator)
services/       → External API wrappers (recall, calendly, notifications)
webhooks/       → Inbound webhook handlers (recall, calendly)
apps/api/       → Express server (entry point + routes)
apps/dashboard/ → Next.js recruiter UI (future)
```

## Rules
- All types live in `types/index.ts` — never define types elsewhere
- Never call the Claude API directly — use agents in `agents/`
- Never call Recall.ai directly — use `services/recall.ts`
- Never call Google Sheets directly — use `database/` layer
- Webhook handlers always respond 200 before doing work

## Key Design Decisions
- Turn-based transcript processing (2s silence = candidate finished) — not word-by-word
- One Claude API call per candidate turn during interview
- One Claude API call at end of interview for evaluation
- Opening script is hardcoded (no Claude call needed)
- Google Sheets is the only database (no Supabase)
- ElevenLabs for TTS (free tier: 10k chars/month)

## Free Tier Limits
- Recall.ai: ~5 hours bot time/month
- ElevenLabs: 10,000 characters/month
- Claude API: pay-per-use

## Build Order (Phases)
1. Phase 1: Interview brain (text only, no Meet)
   - Test with: `npx ts-node database/seed-jobs.ts`
   - Then test agents manually
2. Phase 2: Calendly webhook
3. Phase 3: Recall.ai bot
4. Phase 4: Voice (TTS)
5. Phase 5: Dashboard UI

## Environment Variables
See `.env.example` for all required variables.

## Seeding Data
```bash
# Add job rubrics to Google Sheets
npx ts-node database/seed-jobs.ts
```

## Running Locally
```bash
# Install
npm install

# Start API server
npm run dev:api

# Expose to internet for webhooks (requires ngrok)
ngrok http 3000
# Then update WEBHOOK_BASE_URL in .env with ngrok URL
```

## Google Sheets Tab Headers (paste as row 1)

### candidates
`id | name | email | position | resume_url | status | created_at | notes`

### interviews
`id | candidate_id | candidate_name | candidate_email | position | bot_id | meet_url | scheduled_at | started_at | ended_at | status | stage | calendly_invitee_uri | questions_asked | conversation_history | cancel_reason | rescheduled_to_uri | created_at`

### transcript
`id | interview_id | speaker | text | timestamp`

### scores
`id | interview_id | candidate_name | position | interviewed_at | total_score | recommendation | communication_score | communication_evidence | sales_experience_score | sales_experience_evidence | objection_handling_score | objection_handling_evidence | problem_solving_score | problem_solving_evidence | experience_score | experience_evidence | availability_score | availability_evidence | strengths | concerns | summary | human_decision | decided_by | decided_at`

### jobs
`id | position | min_requirements | competencies | advance_threshold | review_threshold | standard_questions | role_specific_questions | active`
