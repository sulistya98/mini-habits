# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini Habits is a minimalist habit tracker built with Next.js 16 (App Router), Prisma, and NextAuth.js. Users track daily habits, view history, and get AI-powered weekly insights via Google Gemini.

## Commands

```bash
npm run dev              # Dev server on localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint
npx prisma migrate dev   # Create/apply DB migrations
npx prisma studio        # Database GUI
npx prisma generate      # Regenerate Prisma client after schema changes
```

No test framework is configured.

## Architecture

### Tech Stack
- **Next.js 16** (App Router, React Compiler enabled, standalone output)
- **TypeScript** with strict mode, path alias `@/*`
- **Tailwind CSS v4** with `next-themes` (dark mode default)
- **Prisma** — SQLite (dev), PostgreSQL (prod)
- **NextAuth.js v5** (beta) — Credentials provider, JWT sessions
- **Zustand** — Client state synced with server actions
- **Google Generative AI** — User-provided API key for habit analysis and goal decomposition

### Key Files
- `auth.ts` / `auth.config.ts` — NextAuth setup with Credentials provider
- `middleware.ts` — Protects all routes except `/login` and `/register`
- `src/lib/actions.ts` — All server actions (auth, habit CRUD, toggle logs, reminders)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/gowa.ts` — WhatsApp message sender via self-hosted gowa API
- `src/lib/timezones.ts` — Shared timezone list (cannot live in `actions.ts` — see Conventions)
- `src/store/useHabitStore.ts` — Zustand store bridging client state to server actions
- `src/hooks/useSwipe.ts` — Custom touch swipe detection hook (no external deps)
- `prisma/schema.prisma` — Database schema

### Data Flow Pattern
1. Server actions in `actions.ts` handle all data mutations (`'use server'`)
2. Zustand store (`useHabitStore`) calls server actions, then re-syncs state from DB
3. All data actions verify user ownership via `getUserId()` helper
4. Path revalidation (`revalidatePath`) ensures cache coherence after mutations

### Database Models
- **User** — id, email, password (bcrypt), name, phone (WhatsApp number with country code), phoneVerified (boolean, default false), phoneOtp/phoneOtpExpiry (transient OTP storage), timezone (default "Asia/Jakarta"), habits[]
- **Habit** — id, name, reminderTime (HH:mm format, nullable), userId, logs[], reminderLogs[]
- **HabitLog** — id, date (YYYY-MM-DD string), note, habitId; unique on [habitId, date]; cascade delete with parent Habit
- **ReminderLog** — id, habitId, date (YYYY-MM-DD), sentAt; unique on [habitId, date]; cascade delete with parent Habit; prevents duplicate WhatsApp reminders
- **Conversation** — id, title, messages (JSON array of {role, content, habits?}), userId; cascade delete with parent User; indexed on userId

### Routes
- `/login`, `/register` — Public auth pages
- `/` — Today view (daily habit checklist with notes, swipe/chevron navigation to past dates, two-row header: day name + "Today" pill top row, centered date with chevrons bottom row)
- `/manage` — Habit CRUD, reorder, and per-habit reminder time
- `/generate` — Conversational AI habit coach (multi-turn chat with Gemini, saved conversations, inline habit proposals with Add buttons)
- `/history` — Weekly grid view + AI analysis
- `/api/analyze` — POST endpoint for Gemini-powered habit insights (auth required, model allowlisted)
- `/api/generate-habits` — POST endpoint for multi-turn Gemini chat (auth required, model allowlisted, accepts messages array + existingHabits). System prompt instructs AI to answer how-to questions with actionable tips instead of re-proposing habits
- `/api/cron/reminders` — GET endpoint hit every minute by cron; sends WhatsApp reminders via gowa API; protected by `CRON_SECRET` Bearer token (header only, no query param)

### Deployment (Docker / Coolify)
- Deployed to `habit.leadflow.id` via Coolify with PostgreSQL
- **Infrastructure**: Coolify runs inside an OrbStack Linux VM (`coolify-vm`) on a Mac Mini. Access VM via `orb -m coolify-vm`, then `sudo docker ...` for container management
- **Networking**: Cloudflare Tunnel exposes the app to the internet. DNS uses a wildcard CNAME to the tunnel ID. **The Cloudflare DNS record MUST be proxied (orange cloud)** — grey cloud will not work with Cloudflare Tunnel
- **Cloudflare Tunnel**: `cloudflared` runs on the Mac host (not inside OrbStack VM). Tunnel routes in Cloudflare Zero Trust must use the OrbStack VM IP (`192.168.139.101`) instead of `localhost`, since `localhost` on the Mac is not the VM. The wildcard route `*.leadflow.id` → `http://192.168.139.101:80` routes through Traefik inside the VM. OrbStack's auto port-forwarding from VM to Mac localhost is unreliable
- Multi-stage Dockerfile: deps → builder → runner (standalone output)
- `start.sh` runs `prisma migrate deploy` then `node server.js`
- Standalone output excludes `node_modules` — Prisma artifacts must be copied explicitly into the runner stage (`node_modules/.prisma`, `node_modules/@prisma`, `node_modules/prisma`)
- `prisma generate` must run before `npm run build` in the Dockerfile
- NextAuth requires `trustHost: true` in `auth.ts` when behind a reverse proxy
- Port exposes 3000 in Coolify, no host port mapping (Traefik handles routing internally)

### WhatsApp Reminders
- Users set their phone number and timezone on the Profile page
- **Phone numbers require OTP verification** before reminders are sent. A 6-digit code is sent via WhatsApp, expires after 5 minutes. Changing the phone number resets verification. Profile page shows shield icon (green=verified, amber=unverified)
- Per-habit reminder times are set on the Manage page (bell icon → time picker)
- A cron job on the Mac host hits `/api/cron/reminders` every minute via `Authorization: Bearer` header
- The endpoint only queries users with `phoneVerified: true`, checks current time in their timezone, matches against habit reminder times, sends WhatsApp messages via gowa (`gowa.leadflow.id`), and logs to `ReminderLog` to prevent duplicates
- One message per habit, format: `⏰ Hey {name}! Time to: {habitName}`

### Environment Variables
```
DATABASE_URL    # DB connection (default: file:./prisma/dev.db)
AUTH_SECRET     # NextAuth session encryption key
NEXTAUTH_URL    # App public URL
GOWA_URL        # Gowa WhatsApp API base URL (https://gowa.leadflow.id)
GOWA_USER       # Gowa API basic auth username
GOWA_PASS       # Gowa API basic auth password
CRON_SECRET     # Secret for authenticating cron endpoint requests
```

### Conventions
- Form validation uses Zod schemas
- `useActionState` for form submission handling
- `ClientOnly` wrapper component for hydration-safe client rendering
- `cn()` utility (clsx + tailwind-merge) for class name composition
- Redirect errors are caught and re-thrown separately in server actions
- Habit reordering is local-only (Zustand), not persisted to DB
- **`'use server'` files can ONLY export async functions** — never export constants, arrays, or objects from `actions.ts`. Put shared data (e.g., `ALLOWED_TIMEZONES`) in a separate file like `src/lib/timezones.ts`
- Local dev requires Node >= 20 (use `nvm use 24` — v18 won't build Next.js 16)
- No local PostgreSQL; migrations are created manually as SQL files and applied on deploy via `prisma migrate deploy`

### Security
- **API routes require auth** — `/api/analyze` and `/api/generate-habits` call `auth()` and return 401 if not logged in. The middleware matcher excludes `/api/*`, so auth is enforced inside each route handler
- **Gemini model allowlist** — accepted models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, `gemini-2.0-flash-exp`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-pro`; unknown model names fall back to `gemini-1.5-flash`
- **Cron secret: Bearer header only** — no query param to avoid leaking in logs/referrer
- **No PII in error responses** — cron errors reference habit IDs only (no emails or names); AI routes return generic error messages
- **Input validation on all server actions** — habit names 1-100 chars, dates must match `YYYY-MM-DD`, notes max 500 chars, reorder array max 100 items
- **No debug logging of PII** — registration actions don't log emails or full error objects
- **Phone OTP verification** — reminders only sent to `phoneVerified: true` users; prevents abuse of WhatsApp messaging to arbitrary numbers
