## Goal
Construir y deployar plataforma SaaS completa de Ana Reiki: landing, CRM terapéutico, área de consultantes, agenda inteligente, sistema de citas v2, suscripciones, admin full, con reingeniería de roles y turnos planificada.

## Constraints & Preferences
- UX en español (es-AR).
- DB migrations numeradas (001→021, próxima 022).
- Sin SDK externo de pagos — MP vía API directa.
- 3 tiers: Prana (free), Shakti ($99/mes), Ananda ($199/mes).
- Roles actuales: `owner`, `admin`, `gerente`, `consultante`.
- RLS con `is_admin_user()` y `is_owner_user()` SECURITY DEFINER.
- Deploy: VPS Hetzner, Docker + nginx host + Let's Encrypt, `anamurat.online`.
- OAuth MP para multi-cliente escalable (única app developer, cada cliente autoriza).

## Progress
### Done
- **Notificaciones email**: `src/lib/email.ts` con templates HTML. Integrado en POST, cancel y reschedule de appointments. **Pendiente**: verificar dominio Resend (DNS Namecheap) para entrega.
- **Auth hardening**: `src/lib/supabase/middleware.ts` ahora verifica rol admin/owner en rutas `/admin`.
- **CTA duplicado**: Homepage final CTA consolidado.
- **Reminders automáticos**: `/api/reminders` refactorizado con `CRON_SECRET` + service_role + expire_old_approvals. Cron job en VPS activo cada 8 AM.
- **Tests**: 159 tests, 0 failing.
- **Deploy en producción**: Código en GitHub → build + deploy automático en VPS. Site live `anamurat.online` (HTTP 200).
- **MP OAuth configurado**: `MP_CLIENT_ID` y `MP_CLIENT_SECRET` en `.env.production`, container verificado.
- **Flujo OAuth MP completo**: endpoints `/link`, `/callback`, `/status` + `src/lib/mercadopago-oauth.ts` (getMpCredentials, saveMpCredentials, exchangeCodeForToken, refresh automático). Migration 020 (`mp_credentials` table). **Pendiente**: ejecutar migration en Supabase Dashboard.
- **Propuesta reingeniería**: `docs/proposal/PROPUESTA_REINGENIERIA.md` — RBAC (4 roles), disponibilidad por reglas, promos.
- **Sistema de aprobaciones**: Migration 021 (`pending_approvals` table + funciones + rol `gerente` en profiles). Owner aprueba/rechaza acciones sensibles de admin/gerente. Expiración automática integrada en cron de reminders.

### Blocked
- **Migration 020 y 021**: User debe ejecutar ambos SQL en Supabase Dashboard SQL Editor.
- **Resend domain verification**: User debe agregar DNS records en Namecheap. Sin esto los emails fallan (403/1010).
- **Checkout MP**: Deshabilitado — misma cuenta payer/collector. Probar con otro email.

## Key Decisions
- **OAuth sobre token directo**: Escalable multi-cliente. Una app developer, cada cliente autoriza vía link. Token refrescable (180 días).
- **4 roles definitivos**: `consultante`, `gerente` (negocio, sin borrar), `admin` (técnico, cambios sensibles requieren owner), `owner` (control total).
- **Disponibilidad por reglas**: Reemplaza `availability_slots` manual. Slots generados dinámicamente.
- **Permisos en código TypeScript**: `checkAccess(userId, resource, action)` único con Map tipado.
- **Promos**: Tablas `promotions` + `promotion_sessions` + `promo_purchases`. Pago único vía MP preference. Filtro por `allowed_tiers`.
- **Password DB**: `$Karaoke27570` — escapada como `$$Karaoke27570` en `.env.production` para Docker Compose.
- **DATABASE_URL**: Corregida con `$$` para evitar interpolación de Docker Compose. Variable no usada por la app (usa REST API de Supabase).

## Next Steps
1. User: ejecutar migrations 020 y 021 en Supabase Dashboard SQL Editor
2. User: verificar dominio Resend en Namecheap
3. User: testear checkout MP con cuenta diferente
4. User: conectar MP OAuth desde `/admin/pagos`

## Relevant Files
- `supabase/migrations/020_mp_oauth.sql`: Tabla `mp_credentials` + RLS
- `supabase/migrations/021_pending_approvals.sql`: Tabla `pending_approvals` + funciones + rol `gerente`
- `src/lib/mercadopago-oauth.ts`: OAuth utilities (getMpCredentials, exchangeCodeForToken, saveMpCredentials, getMpAuthUrl)
- `src/app/api/mercadopago/oauth/link/route.ts`: GET → URL de autorización
- `src/app/api/mercadopago/oauth/callback/route.ts`: GET code → token → guarda en DB
- `src/app/api/mercadopago/oauth/status/route.ts`: GET → { connected, mp_user_id, is_expired }
- `src/app/api/reminders/route.ts`: Cron job + expire_old_approvals()
- `src/lib/auth/roles.ts`: Solo `isAdmin()` — pendiente refactor a `checkAccess()`
- `docs/proposal/PROPUESTA_REINGENIERIA.md`: Propuesta completa RBAC + turnos + promos
