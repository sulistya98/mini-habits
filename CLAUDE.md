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
- **Google Generative AI** — User-provided API key for habit analysis

### Key Files
- `auth.ts` / `auth.config.ts` — NextAuth setup with Credentials provider
- `middleware.ts` — Protects all routes except `/login` and `/register`
- `src/lib/actions.ts` — All server actions (auth, habit CRUD, toggle logs)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/store/useHabitStore.ts` — Zustand store bridging client state to server actions
- `prisma/schema.prisma` — Database schema

### Data Flow Pattern
1. Server actions in `actions.ts` handle all data mutations (`'use server'`)
2. Zustand store (`useHabitStore`) calls server actions, then re-syncs state from DB
3. All data actions verify user ownership via `getUserId()` helper
4. Path revalidation (`revalidatePath`) ensures cache coherence after mutations

### Database Models
- **User** — id, email, password (bcrypt), name, habits[]
- **Habit** — id, name, userId, logs[]
- **HabitLog** — id, date (YYYY-MM-DD string), note, habitId; unique on [habitId, date]; cascade delete with parent Habit

### Routes
- `/login`, `/register` — Public auth pages
- `/` — Today view (daily habit checklist with notes)
- `/manage` — Habit CRUD and reorder
- `/history` — Weekly grid view + AI analysis
- `/api/analyze` — POST endpoint for Gemini-powered habit insights

### Deployment (Docker / Coolify)
- Deployed to `habit.leadflow.id` via Coolify with PostgreSQL
- Multi-stage Dockerfile: deps → builder → runner (standalone output)
- `start.sh` runs `prisma migrate deploy` then `node server.js`
- Standalone output excludes `node_modules` — Prisma artifacts must be copied explicitly into the runner stage (`node_modules/.prisma`, `node_modules/@prisma`, `node_modules/prisma`)
- `prisma generate` must run before `npm run build` in the Dockerfile
- NextAuth requires `trustHost: true` in `auth.ts` when behind a reverse proxy

### Environment Variables
```
DATABASE_URL    # DB connection (default: file:./prisma/dev.db)
AUTH_SECRET     # NextAuth session encryption key
NEXTAUTH_URL    # App public URL
```

### Conventions
- Form validation uses Zod schemas
- `useActionState` for form submission handling
- `ClientOnly` wrapper component for hydration-safe client rendering
- `cn()` utility (clsx + tailwind-merge) for class name composition
- Redirect errors are caught and re-thrown separately in server actions
- Habit reordering is local-only (Zustand), not persisted to DB
