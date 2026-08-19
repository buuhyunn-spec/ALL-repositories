# CourtBook

A court booking app — browse, check availability, and reserve tennis, basketball, pickleball, padel, and squash courts.

Built frontend-first: the full UX works now with mock data; backend and authentication plug in later without touching component code.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Pages

| Route | Page |
|---|---|
| `/` | Home — hero, search, featured courts |
| `/courts` | Browse courts with filter/search |
| `/courts/:id` | Court detail + availability calendar |
| `/book/:courtId` | Booking flow (date → time → confirm) |
| `/bookings` | My bookings dashboard |
| `/login` | Sign in stub |

## Architecture

All data access goes through `src/services/`. Components never fetch directly.

```
src/
├── services/          ← ★ swap these for real API calls
│   ├── courtsService.ts
│   ├── bookingsService.ts
│   ├── timeSlotsService.ts
│   └── authService.ts
├── context/
│   └── AuthContext.tsx  ← useAuth() hook wired everywhere; returns null user for now
├── types/index.ts       ← Court, Booking, TimeSlot, User interfaces
├── data/                ← mock data (replaced by API when backend is ready)
└── lib/api.ts           ← fetch wrapper stub (add base URL + auth interceptor later)
```

## Adding the backend

1. Set `VITE_API_URL=https://your-api.com` in `.env.local`
2. Replace mock returns in `src/services/` with `api.get()`/`api.post()` calls
3. Expand `AuthContext.tsx` with real JWT/session logic
4. Wire token interceptor in `src/lib/api.ts`
5. Remove the `localStorage` fallback in `bookingsService.ts`

## Tech stack

- **React 18 + TypeScript** — Vite
- **React Router v6** — routing
- **Tailwind CSS** — styling
- **Zustand** — state (booking flow)
- **date-fns** — date handling
- **Lucide React** — icons
