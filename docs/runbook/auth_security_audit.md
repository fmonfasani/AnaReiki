# Auth Security Audit — AnaReiki

**Fecha:** 2026-03-01
**Scope:** Análisis estático de código y migraciones SQL. Sin inspección de instancia Supabase live.
**Generado por:** Codex CLI (audit automático del repo)

---

## A. File Map — Archivos de Auth

```
src/app/login/page.tsx
src/app/registro/page.tsx
src/app/api/auth/logout/route.ts
src/components/LogoutButton.tsx
src/middleware.ts
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/app/miembros/layout.tsx
src/app/admin/layout.tsx
src/app/admin/agenda/page.tsx
src/app/miembros/page.tsx
src/app/miembros/reservar/page.tsx
src/app/miembros/evolucion/page.tsx
src/actions/agenda.ts
src/app/admin/consultantes/page.tsx
src/components/BookingCalendar.tsx
src/types/database.types.ts
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_admin_roles_and_schema.sql
supabase/migrations/003_consultant_dashboard_schema.sql
```

---

## B. Execution Flow — Login Request (10 pasos)

1. `GET /login` → `src/app/login/page.tsx` — renderiza form
2. Submit → `handleLogin()` → `supabase.auth.signInWithPassword()`
3. Cliente Supabase viene de `src/lib/supabase/client.ts` (`createBrowserClient`)
4. Auth exitosa → `router.push("/miembros")`
5. Request llega a `src/middleware.ts` → llama `updateSession(request)`
6. `src/lib/supabase/middleware.ts` crea server client con cookies → `auth.getUser()`
7. Sin user y path `/miembros` o `/admin` → redirect a `/login`
8. `src/app/miembros/layout.tsx` → vuelve a llamar `auth.getUser()` + query `profiles.role`
9. `src/app/admin/layout.tsx` → `auth.getUser()` + verifica `profiles.role === 'admin'`
10. Logout → `LogoutButton.tsx` POST `/api/auth/logout` → `supabase.auth.signOut()`

---

## C. Security Boundaries

| Capa | Archivos | Confianza |
|------|----------|-----------|
| **Browser** (no confiable) | `login/page.tsx`, `registro/page.tsx`, `LogoutButton.tsx`, `admin/consultantes/page.tsx`, `BookingCalendar.tsx` | ❌ Untrusted |
| **Server** (app code) | `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/server.ts`, `miembros/layout.tsx`, `admin/layout.tsx`, `actions/agenda.ts`, `api/auth/logout/route.ts` | ⚠️ Anon key |
| **Database** (RLS) | `001_initial_schema.sql`, `002_admin_roles_and_schema.sql`, `003_consultant_dashboard_schema.sql` | ✅ Authoritative |

---

## D. Vulnerabilidades (ordenadas por severidad)

### 🔴 CRÍTICO — Escalación de privilegios: usuario puede hacerse admin

**Por qué:** La política de update de propio perfil (migración 001, línea 33) fue creada antes de que se agregara la columna `role` (migración 002, línea 7). No se restringió el campo `role` en la política.

**Evidencia:**
- `001_initial_schema.sql:33` → política "Users can update own profile" sin columnas restringidas
- `002_admin_roles_and_schema.sql:7` → agrega columna `role TEXT DEFAULT 'user'`
- `admin/layout.tsx:22` → gate admin solo verifica `profiles.role === 'admin'`

**Path de ataque:**
```
1. Usuario autenticado → UPDATE profiles SET role='admin' WHERE id=auth.uid()
2. RLS lo permite (update own profile policy sin restricciones de columna)
3. Admin layout lee role='admin' → acceso total al panel
```

**Fix:**
```sql
-- Agregar a 002_admin_roles_and_schema.sql
CREATE POLICY "Users cannot update own role"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
```
O restringir la política original a columnas específicas (excluir `role` y `is_premium`).

---

### 🔴 CRÍTICO — Self-enable premium

**Por qué:** Misma política de update propia permite `UPDATE profiles SET is_premium=true`.

**Fix:** Misma solución que arriba — restringir columnas permitidas en la política de update.

---

### 🟠 ALTO — Server Actions sin role check

**Archivos:** `src/actions/agenda.ts:12`, `src/actions/agenda.ts:108`, `src/actions/agenda.ts:164`

`saveAvailability`, `saveSpecificSlot`, `blockDate` — solo verifican que el usuario esté autenticado, no que sea admin.

**Riesgo:** Si RLS no cubre la tabla correctamente, cualquier usuario autenticado puede modificar disponibilidad de consultores.

**Fix:**
```typescript
// Agregar al inicio de cada server action admin
const { data: profile } = await supabase.from("profiles").select("role").single();
if (profile?.role !== "admin") throw new Error("Unauthorized");
```

---

### 🟠 ALTO — Schema inconsistente entre código y migraciones

**Código usa columnas que no existen en las migraciones:**

| Columna usada en código | Tabla | Existe en migración |
|------------------------|-------|---------------------|
| `consultant_id` | `availability` | ❌ No (`002` define `admin_id`) |
| `specific_date` | `availability` | ❌ No |
| `is_available` | `availability` | ❌ No (`002` define `is_active`) |
| `consultant_id` | `appointments` | ❌ No |
| `client_id` | `appointments` | ❌ No |

**Archivos afectados:** `admin/agenda/page.tsx:22`, `actions/agenda.ts:39`, `BookingCalendar.tsx:54`

**Impacto:** La funcionalidad de agenda y booking probablemente falla silenciosamente en producción.

---

### 🟡 MEDIO — Admin UI de contenido incompatible con RLS

**`admin/contenido/page.tsx:23`** inserta contenido desde sesión browser (anon key).

**`001_initial_schema.sql:72`** solo permite INSERT en `content` a `service_role`.

**Resultado:** El panel admin no puede publicar contenido con la arquitectura actual.

---

### 🟡 MEDIO — Booking sin ordering determinístico del admin

**`BookingCalendar.tsx:24`** selecciona el primer `profiles.role='admin'` sin `ORDER BY`.

**Riesgo:** Con múltiples admins, los bookings pueden apuntar a consultores arbitrarios.

---

### 🟡 MEDIO — Race conditions en booking y mood tracker

- **Booking:** check-then-insert sin unicidad DB para overlapping appointments
- **MoodTracker:** verifica "ya registró hoy" luego inserta — sin constraint `UNIQUE(user_id, date)` en migración

---

### 🟡 MEDIO — Client stalls en páginas protegidas

- `miembros/evolucion/page.tsx:28` → retorna sin limpiar estado si user es null
- `miembros/reservar/page.tsx:21` → muestra loading infinito si user es null (no redirect)

---

### 🟡 MEDIO — Logout ignora status HTTP

**`LogoutButton.tsx:13-14`** siempre hace `router.push("/login")` independientemente del status de la respuesta del signOut. Fallos silenciosos de logout.

---

## E. Lifecycle Trace Completo

### Registro
```
GET /registro → registro/page.tsx:8
              → handleSignUp() :18
              → supabase.auth.signUp() :24
              → trigger on_auth_user_created (001:129)
              → INSERT INTO public.profiles
```

### Login
```
GET /login → login/page.tsx:8
           → handleLogin() :16
           → supabase.auth.signInWithPassword() :22
           → router.push("/miembros") :30
           → middleware.ts → updateSession()
           → lib/supabase/middleware.ts → auth.getUser()
           → miembros/layout.tsx:15 → auth.getUser() + profiles.role
```

### Admin
```
GET /admin → admin/layout.tsx:14 → auth.getUser()
           → profiles.select("role") :22
           → role !== 'admin' → redirect("/miembros") :23
```

---

## F. Fixes Prioritizados

| # | Fix | Archivo/Migración | Urgencia |
|---|-----|-------------------|---------|
| 1 | Restringir columnas en política update de profiles (excluir `role`, `is_premium`) | Nueva migración 004 | 🔴 Inmediato |
| 2 | Role check en server actions de agenda | `src/actions/agenda.ts` | 🔴 Inmediato |
| 3 | Alinear schema de `availability` y `appointments` con lo que usa el código | Nueva migración 004 | 🟠 Esta semana |
| 4 | Usar `service_role` key en server actions para mutaciones de `content` | `src/actions/` o `src/app/api/` | 🟠 Esta semana |
| 5 | `ORDER BY` en query de admin para BookingCalendar | `BookingCalendar.tsx` | 🟡 Próximo sprint |
| 6 | Constraints `UNIQUE` en mood tracker y appointments | Nueva migración | 🟡 Próximo sprint |
| 7 | Manejar error en client stalls (evolucion, reservar) | `page.tsx` de cada uno | 🟡 Próximo sprint |
| 8 | Manejar response status en LogoutButton | `LogoutButton.tsx` | 🟡 Próximo sprint |
