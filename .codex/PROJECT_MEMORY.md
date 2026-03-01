# PROJECT_MEMORY.md — AnaReiki Internal Semantic Map
# Generated: 2026-03-01
# Purpose: Internal memory/context for AI agents. Always prefer AGENTS.md for architecture.

## Entrypoints
- **Public home**: `src/app/page.tsx`
- **Root layout**: `src/app/layout.tsx`
- **CSS tokens**: `src/app/globals.css`
- **Middleware**: `src/middleware.ts`

## Auth System
- Provider: **Supabase** (email/password + optional OAuth)
- Session: Cookie-based via `@supabase/ssr`
- Refresh: `updateSession()` in `src/lib/supabase/middleware.ts` called on every request
- Protected routes: `/miembros`, `/admin` — redirect to `/login` if no session
- Reverse protect: `/login`, `/registro` — redirect to `/miembros` if already authenticated
- Admin check: Done inside layout/page components (NOT in middleware)

## User Model
**File**: `supabase/migrations/001_initial_schema.sql`
**Table**: `public.profiles`
```sql
id         UUID  -- FK to auth.users(id), auto-populated
email      TEXT
full_name  TEXT
avatar_url TEXT
is_premium BOOLEAN DEFAULT false
```
Populated automatically via trigger `on_auth_user_created` on every new Supabase signup.

## Content Model
**File**: `supabase/migrations/001_initial_schema.sql`
**Table**: `public.content`
```sql
type        TEXT  -- 'video' | 'podcast'
external_id TEXT  -- Cloudinary public_id OR Spotify URL
is_premium  BOOLEAN DEFAULT true
```

## Admin System
**Migration**: `supabase/migrations/002_admin_roles_and_schema.sql`
**Table**: `admin_users`
- Admin access checked in layout: `src/app/admin/layout.tsx`
- Pages: `/admin`, `/admin/agenda`, `/admin/consultantes`, `/admin/contenido`

## Booking System
**Migration**: `supabase/migrations/003_consultant_dashboard_schema.sql`
**Component**: `src/components/BookingCalendar.tsx`
- Uses `react-day-picker` for date selection
- Uses `date-fns` for date manipulation
- Appointments stored in `appointments` table

## Mood Tracker
**Component**: `src/components/MoodTracker.tsx`
- Members log daily moods
- Stored in `moods` table
- Premium members only (`is_premium = true`)

## Email
- Provider: **Resend**
- Contact form at `/contacto`
- API route: `src/app/api/`

## Media
- Videos: **Cloudinary** via `next-cloudinary`
- Component: `src/components/VideoPlayer.tsx`
- Podcast: likely Spotify embed
- Component: `src/components/PodcastPlayer.tsx`

## Frontend Components Map
| Component           | Purpose                          | Used in               |
|---------------------|----------------------------------|-----------------------|
| Navbar              | Navigation bar                   | All public pages      |
| Footer              | Site footer                      | All public pages      |
| Therapies           | Service cards                    | Home page             |
| Encounters          | Sessions/encounters section      | Home page             |
| Timeline            | Journey visualization            | Home page             |
| BookingCalendar     | Appointment date picker          | /miembros or /admin   |
| MoodTracker         | Daily mood journal               | /miembros             |
| AdminLayoutUI       | Admin panel chrome               | /admin                |
| LogoutButton        | Supabase signout                 | /miembros, /admin     |
| VideoPlayer         | Cloudinary video embed           | /miembros             |
| PodcastPlayer       | Audio/podcast embed              | /miembros             |

## Potential Code Smells & Security Issues
> Full audit: `docs/runbook/auth_security_audit.md`

### ✅ FIJADO #1 & #2 — Escalación de privilegios y Self-premium
- **Status**: SOLUCIONADO
- **Fix**: Migración `004_security_hardening.sql` restringe política UPDATE agregando `WITH CHECK` que valida que el `role` y `is_premium` no hayan cambiado.

### ✅ FIJADO #3 — Server Actions con role check
- **Status**: SOLUCIONADO
- **Fix**: Se agregó `isAdminFromAppMetadata(user)` en `src/actions/agenda.ts`.

### ✅ FIJADO #4 — Schema alignment
- **Status**: SOLUCIONADO
- **Fix**: Migración `004` agregó columnas `consultant_id`, `specific_date` e `is_available` para coincidir con el código.
### 🟡 MEDIO #5 — Admin content UI vs RLS
- `admin/contenido/page.tsx:23` inserta content con anon key
- `001:72` solo permite INSERT a `service_role`
- **Fix:** mover mutaciones de content a server action con service_role key

### 🟡 MEDIO #6 — Race conditions
- Booking: check-then-insert sin UNIQUE constraint en appointments
- MoodTracker: "ya registró hoy" check sin `UNIQUE(user_id, date)` en DB

### 🟡 MEDIO #7 — Client stalls
- `evolucion/page.tsx:28` retorna sin redirect si user es null
- `reservar/page.tsx:21` loading infinito si user es null

### 🟡 MEDIO #8 — Logout sin manejo de error
- `LogoutButton.tsx:13-14` siempre pushes `/login` ignorando response status

## Last Validation Run
Date: 2026-03-01
- [x] Repo structure listed
- [x] User model located: `public.profiles` en migration 001
- [x] Last commit: `bed97a6` en `main`
- [x] Code smells: 2 críticos + 6 medios/altos detectados por audit
- [x] Patches propuestos: ver `docs/runbook/auth_security_audit.md`

