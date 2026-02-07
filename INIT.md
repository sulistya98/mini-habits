# Mini Habits - Project Initialization & Context

**Project:** Mini Habits
**Description:** A minimalist, local-first habit tracker built with Next.js 16, utilizing Google Gemini AI for weekly insights.
**Live URL:** https://habit.leadflow.id
**Repository:** https://github.com/sulistya98/mini-habits

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (with Dark Mode support via `next-themes`)
- **State Management:** Zustand v5 (with `persist` middleware for local-first storage)
- **AI Integration:** Google Generative AI (Gemini 1.5 Flash) via `src/app/api/analyze`
- **Icons:** Lucide React
- **Deployment:** Docker (Standalone Output) via Coolify

## Architecture Highlights
- **Local-First:** All habit data is stored in the user's browser (LocalStorage) using Zustand's `persist` middleware. No server-side database is required.
- **Dark Mode Default:** The application defaults to Dark Mode ("Less is More" aesthetic) but includes a toggle for Light Mode.
- **Client-Side API Key:** The user provides their own Gemini API Key, which is stored locally and sent to the server only for analysis requests.
- **Dockerized:** The project includes a multi-stage `Dockerfile` optimized for Next.js standalone output to minimize image size and ensure consistency.

## Directory Structure
```
/
├── Dockerfile              # Multi-stage build for production
├── docker-compose.yml      # Local orchestration (optional)
├── next.config.ts          # Configured for output: 'standalone'
├── src/
│   ├── app/
│   │   ├── api/analyze/    # AI Analysis Endpoint (Proxy)
│   │   ├── history/        # Analytics & Visualization Page
│   │   ├── manage/         # Habit Management Page
│   │   ├── page.tsx        # Home Page (Daily Tracker)
│   │   └── layout.tsx      # Root Layout
│   ├── components/         # Reusable UI components
│   │   └── ClientOnly.tsx  # Hydration mismatch prevention wrapper
│   ├── store/
│   │   └── useHabitStore.ts # Global State (Zustand + Persistence)
│   └── lib/
│       └── utils.ts        # Helper functions (cn, etc.)
└── public/                 # Static assets
```

## Key Commands

### Development
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Production Build (Local)
```bash
npm run build
npm start
```

### Docker Build (Local)
```bash
docker build -t mini-habits .
docker run -p 3000:3000 mini-habits
```

## Deployment Strategy (Coolify)
1.  **Source:** Git Repository (GitHub)
2.  **Build Pack:** Docker (Uses project `Dockerfile`)
3.  **Port:** 3000
4.  **Environment Variables:** None required for build/runtime (API Key is client-injected).
5.  **Persistence:** Data persists on the client device (LocalStorage). Server redeployments do not wipe user data.

## History
- **Feb 07, 2026:** Initial Git setup, push to GitHub, and successful deployment to Coolify at `habit.leadflow.id`.

---
*Created by Gemini CLI*
