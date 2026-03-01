# 🧠 AnaReiki Project: Codex Instructions

## 🏗️ Architecture & Stack
- **Framework**: Next.js (App Router)
- **Database / Auth**: Supabase (PostgreSQL)
- **Styling**: Vanilla CSS, Framer Motion for animations.
- **Hosting**: Vercel (Production) & Cloudinary (Assets/Video).

## 🚀 Key Patterns for LLMs
1. **Server Actions First**: All database writes MUST happen through files in `src/actions/`. Use the `createClient` from `@/lib/supabase/server` for these.
2. **Security & RLS**: Never trust the client with user IDs or roles. Always verify the current user within Server Actions. Use the `jwt_is_admin()` function in SQL policies to protect sensitive data.
3. **Database Types**: When interacting with the database, use the types defined in `src/types/database.types.ts`.
4. **Member vs Admin**: 
    - `/miembros/*`: Exclusive for logged-in users.
    - `/admin/*`: Exclusive for users with `{role: 'admin'}` in `app_metadata`.

## 🛡️ Database Constraints
- No overlapping appointments (enforced by `EXCLUSION CONSTRAINT`).
- Statuses: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`.

## 🧪 Testing
- Always run `npm run test -- --run` to verify logic after major changes.
- Focus on `src/actions/` testing.

---
*Follow these instructions to maintain architectural consistency and high code quality.*
