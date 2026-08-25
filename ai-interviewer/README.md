# AI Interviewer

An AI-powered initial screening interview system. Candidates book via Calendly, an AI bot joins their Google Meet, conducts a structured interview using Claude, and generates a scored report for recruiter review.

## Architecture

```
Candidate books Calendly
        ↓
Webhook → create interview session + schedule Recall.ai bot
        ↓
Interview time → bot joins Google Meet
        ↓
Candidate speaks → Recall.ai transcribes → silence detected
        ↓
Claude decides next question → ElevenLabs TTS → bot speaks
        ↓
Call ends → Claude evaluates full transcript
        ↓
Score + recommendation saved to Google Sheets
        ↓
Recruiter reviews and approves / rejects
```

## Tech Stack

| Component | Technology |
|---|---|
| AI Brain | Claude API (`claude-opus-5`) |
| Meeting Bot | Recall.ai |
| Scheduling | Calendly |
| Meeting Platform | Google Meet |
| Voice (TTS) | ElevenLabs |
| Database | Google Sheets |
| Backend | Node.js + Express |
| Language | TypeScript |

## Quick Start

### 1. Clone and install
```bash
git clone <repo>
cd ai-interviewer
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Set up Google Sheets
1. Create a new Google Spreadsheet
2. Add 5 tabs: `candidates`, `interviews`, `transcript`, `scores`, `jobs`
3. Paste the header rows from `CLAUDE.md` into row 1 of each tab
4. Share the spreadsheet with your service account email

### 4. Seed job rubrics
```bash
npx ts-node database/seed-jobs.ts
```

### 5. Run the server
```bash
npm run dev:api
```

### 6. Expose webhooks locally (development)
```bash
ngrok http 3000
# Update WEBHOOK_BASE_URL in .env with your ngrok URL
```

## Phase 1 Testing (No Google Meet Needed)

Test the interview brain with a simple text script:

```typescript
// test/interview-brain.ts
import { getOpeningScript } from "./agents/interviewer";
import { getJobRubricForPosition } from "./database/jobs";

const rubric = await getJobRubricForPosition("Sales Representative");
const opening = getOpeningScript("Maria Santos", rubric.position);
console.log(opening);
// Continue manually simulating candidate responses...
```

## Project Structure

```
ai-interviewer/
├── types/              All TypeScript types
├── database/           Google Sheets CRUD
├── interview/          State machine + turn buffer + scoring
├── agents/             Claude SDK agents
├── services/           External API wrappers
├── webhooks/           Recall.ai + Calendly handlers
├── apps/
│   ├── api/            Express server
│   └── dashboard/      Next.js recruiter UI (Phase 5)
├── CLAUDE.md           Instructions for Claude Code
└── .env.example        Environment variable template
```

## Compliance

The AI interviewer is built with compliance safeguards:
- Never evaluates accent, speech style, or fluency
- Never asks about age, family, health, or religion
- Evaluates job-relevant evidence only
- Human approval required for all hiring decisions

## License

Private — internal use only.
