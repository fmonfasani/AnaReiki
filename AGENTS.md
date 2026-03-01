# AGENTS.md — AnaReiki Project

> This file is the primary context document for AI agents working on this codebase.
> Read this FIRST before doing anything else.

## Project Overview

**AnaReiki** is a wellness/holistic therapy web app for a Reiki practitioner named Ana.
It is a public-facing marketing site + a members-only area + an admin dashboard.

| Property      | Value                                |
|---------------|--------------------------------------|
| Framework     | Next.js 16 (App Router)              |
| Language      | TypeScript                           |
| Styling       | Tailwind CSS v4                      |
| Database      | Supabase (PostgreSQL + Auth)         |
| ORM           | None — Supabase JS client directly   |
| Auth          | Supabase SSR auth (cookie-based)     |
| Media         | Cloudinary (videos), Spotify (audio) |
| Email         | Resend                               |
| Animation     | Framer Motion                        |
| Deployment    | Vercel (assumed)                     |
| Testing       | ❌ None configured                   |

---

## Architecture

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Public home page (Hero, Therapies, CTA)
│   ├── layout.tsx        # Root layout with fonts and metadata
│   ├── globals.css       # Global CSS / design tokens
│   ├── login/            # Login page (redirects if authenticated)
│   ├── registro/         # Registration page
│   ├── miembros/         # Protected members area
│   ├── admin/            # Admin panel (auth-guarded)
│   │   ├── agenda/       # Appointment management
│   │   ├── consultantes/ # Client management
│   │   └── contenido/    # Content management
│   ├── contacto/         # Contact form
│   ├── servicios/        # Services/therapies listing
│   ├── filosofia/        # About/philosophy page
│   └── api/              # API routes
├── components/           # Reusable UI components
├── lib/
│   └── supabase/         # Supabase client factories
│       ├── client.ts     # Browser client
│       ├── server.ts     # Server client (RSC / actions)
│       └── middleware.ts # Session refresh utility
├── middleware.ts         # Auth middleware (route protection + redirects)
└── types/                # Shared TypeScript types
```

---

## Database Schema (Supabase / PostgreSQL)

### `profiles` table
| Column       | Type      | Notes                                |
|--------------|-----------|--------------------------------------|
| id           | UUID      | FK → auth.users(id), PK              |
| email        | TEXT      | Unique                               |
| full_name    | TEXT      |                                      |
| avatar_url   | TEXT      |                                      |
| is_premium   | BOOLEAN   | Unlocks premium content              |
| created_at   | TIMESTAMPTZ |                                    |
| updated_at   | TIMESTAMPTZ |                                    |

Auto-created via trigger `on_auth_user_created` on Supabase signup.

### `content` table
| Column       | Type    | Notes                                        |
|--------------|---------|----------------------------------------------|
| id           | UUID    | PK                                           |
| title        | TEXT    |                                              |
| description  | TEXT    |                                              |
| type         | TEXT    | `'video'` or `'podcast'`                     |
| external_id  | TEXT    | Cloudinary public_id OR Spotify URL          |
| thumbnail_url| TEXT    |                                              |
| duration     | INTEGER | Seconds                                      |
| is_premium   | BOOLEAN | Gated behind `profiles.is_premium`           |
| published_at | TIMESTAMPTZ |                                          |

### Additional tables (migration 002 & 003)
- `admin_users` — tracks admin-role users
- `appointments` — booking records
- `moods` — mood tracker journal entries
- `consultants` — therapist profiles

### Row Level Security (RLS)
- `profiles`: users can only read/write their own row
- `content`: all authenticated users can SELECT; only service role can mutate
- Admin tables: separate policies; check migration files for details

---

## Authentication Flow

```
User visits /miembros or /admin
        ↓
middleware.ts runs updateSession()
        ↓
If no session → redirect to /login
If session + visiting /login → redirect to /miembros
        ↓
Admin routes: guarded by layout components checking admin_users table
```

**Key files:**
- `src/middleware.ts` — Route gating + session refresh
- `src/lib/supabase/middleware.ts` — `updateSession()` implementation
- `src/lib/supabase/server.ts` — Server-side Supabase client
- `src/lib/supabase/client.ts` — Browser-side Supabase client

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## Key Patterns

1. **Data fetching**: Prefer Server Components with `src/lib/supabase/server.ts`
2. **Mutations**: Use Server Actions in `src/actions/`
3. **Client state**: Only use `'use client'` when strictly necessary (interactivity/hooks)
4. **Auth check in Server Component**: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();`
5. **Tailwind**: CSS variables defined in `globals.css` as design tokens

---

## Active Skills
Registered in `.codex/skills/`:
- `filesystem.md` — Read and navigate files
- `git.md` — Inspect history, diffs, blame
- `shell.md` — Run dev server, lint, build
- `test.md` — Test runner (setup required)

---

## Known Issues / Technical Debt
- ❌ No test suite configured (Vitest recommended)
- ⚠️ `OPENAI_API_KEY` in `.env` is commented out — AI features not yet active
- ⚠️ Admin routes rely on layout-level auth checks, not middleware — risk of direct URL access
- ⚠️ `content` table mutation locked to `service_role` — no admin UI write path via regular auth
- ⚠️ Duplicate CTA text in `page.tsx`: "Contactame" and "Contactar" both link to WhatsApp / contact — inconsistent UX

---

## MCP Servers (`.codex/mcp.json`)
```json
{
  "servers": {
    "filesystem": { "command": "python", "args": ["-m", "mcp.server.fs", "--root", "."] },
    "git":        { "command": "python", "args": ["-m", "mcp_server_git"] }
  }
}
```
