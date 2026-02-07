# Mini Habits - Project Initialization & Context

**Project:** Mini Habits
**Description:** A minimalist, local-first habit tracker built with Next.js 16, utilizing Google Gemini AI for weekly insights.
**Live URL:** https://habit.leadflow.id
**Repository:** https://github.com/sulistya98/mini-habits

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (with Dark Mode support via `next-themes`)
- **State Management:** Zustand v5 (synced with Server Actions)
- **Database:** Prisma ORM (SQLite for Dev, PostgreSQL for Production)
- **Authentication:** NextAuth.js v5 (Credentials Provider)
- **AI Integration:** Google Generative AI (Gemini 1.5 Flash) via `src/app/api/analyze`
- **Icons:** Lucide React
- **Deployment:** Docker (Standalone Output) via Coolify

## Architecture Highlights
- **Server-Side Sync:** Habit data is stored in a database (PostgreSQL/SQLite) and accessed via Next.js Server Actions.
- **User Management:** Users can Sign Up and Log In to access their private data across devices.
- **Dark Mode Default:** The application defaults to Dark Mode ("Less is More" aesthetic) but includes a toggle for Light Mode.
- **Client-Side API Key:** The user provides their own Gemini API Key, which is stored locally and sent to the server only for analysis requests.
- **Dockerized:** The project includes a multi-stage `Dockerfile` optimized for Next.js standalone output.

## Directory Structure
```
/
├── Dockerfile              # Multi-stage build for production
├── docker-compose.yml      # Local orchestration
├── prisma/
│   ├── schema.prisma       # Database Schema
│   └── dev.db              # Local Development DB (SQLite)
├── src/
│   ├── app/
│   │   ├── login/          # Login Page
│   │   ├── register/       # Registration Page
│   │   └── ...
│   ├── lib/
│   │   ├── actions.ts      # Server Actions (Auth & Data)
│   │   ├── prisma.ts       # DB Client Singleton
│   │   └── ...
│   ├── store/
│   │   └── useHabitStore.ts # Global State (Syncs with Server)
└── ...
```

## Key Commands

### Development
```bash
npx prisma migrate dev  # Run DB migrations
npm run dev             # Start Server
```

## Deployment Strategy (Coolify)
1.  **Source:** Git Repository (GitHub)
2.  **Build Pack:** Docker (Uses project `Dockerfile`)
3.  **Port:** 3000
4.  **Database:** Provision a PostgreSQL service in Coolify.
5.  **Environment Variables:**
    - `DATABASE_URL`: Connection string to your PostgreSQL service (e.g., `postgresql://user:pass@host:5432/db`).
    - `AUTH_SECRET`: Generate a random string (run `openssl rand -base64 32`) for session security.

## History
- **Feb 07, 2026:** Initial Git setup, push to GitHub, and successful deployment to Coolify at `habit.leadflow.id`.

---
*Created by Gemini CLI*
