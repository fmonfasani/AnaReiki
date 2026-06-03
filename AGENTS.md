## Goal
Construir y deployar plataforma SaaS completa de Ana Reiki: landing, CRM terapéutico, área de consultantes, agenda inteligente, sistema de citas v2, suscripciones, admin full, con reingeniería de roles y turnos planificada.

## Constraints & Preferences
- UX en español (es-AR).
- DB migrations numeradas (001→022, próxima 023).
- Sin SDK externo de pagos — MP vía API directa.
- 3 tiers: Prana (free), Shakti ($99/mes), Ananda ($199/mes).
- Roles actuales: `owner`, `admin`, `gerente`, `consultante`.
- RLS con `is_admin_user()` (admin+owner) e `is_owner_user()` (solo owner) SECURITY DEFINER.
- Deploy: VPS Hetzner, Docker + nginx host + Let's Encrypt, `anamurat.online`.
- OAuth MP para multi-cliente escalable (única app developer, cada cliente autoriza).

## Progress
### Done
- **Notificaciones email**: `src/lib/email.ts` con templates HTML (confirmación, cancelación, reprogramación, notificación admin). Integrado en POST, cancel y reschedule de appointments. **Pendiente**: verificar dominio Resend (DNS Namecheap) para entrega.
- **Auth hardening**: `src/lib/supabase/middleware.ts` verifica rol admin/owner en rutas `/admin`.
- **Reminders automáticos**: `/api/reminders` refactorizado — usa `CRON_SECRET` + service_role + `expire_old_approvals()`. Cron job en VPS activo cada 8 AM.
- **Tests**: 165 tests, 0 failing.
- **Deploy en producción**: Código en GitHub → build + deploy automático en VPS. Site live `anamurat.online` (HTTP 200).
- **MP OAuth configurado**: `MP_CLIENT_ID=8753327212563967` y `MP_CLIENT_SECRET=2ZIeh15jCv05t3X5NlLTPZ3zLU7PDtPz` verificados en container.
- **Migration 020** (`mp_credentials`): Ejecutada en Supabase Dashboard.
- **Migration 021** (`pending_approvals` + rol `gerente`): Ejecutada en Supabase Dashboard.
- **Roles TypeScript**: `isAdmin()` retorna true para admin y owner. Nueva función `isOwner()`. Admin layout bug corregido. check-role route actualizado.
- **Owner asignado**: `fmonfasani@gmail.com` rol cambiado de admin a owner.
- **MP OAuth button UI**: Banner "Conectar Mercado Pago" en `/admin/pagos`.
- **Agenda reingeniería (Fase 1)**: Migration 022 `availability_rules_v2` + slot generation functions (`get_available_slots_v2`, `count_available_slots_v2`, `get_available_dates_v2`) + data migration desde v1. Sin breaking changes (strangler fig).
- **Agenda reingeniería (Fase 2)**: API CRUD admin para `availability_rules_v2` (`GET/POST /api/admin/availability/rules`, `PUT/DELETE /api/admin/availability/rules/[id]`).
- **Agenda reingeniería (Fase 3)**: `GET /api/availability` migrado a `get_available_slots_v2()` con soporte `from`/`to` para DatePicker.
- **Agenda reingeniería (Fase 4)**: `POST /api/appointments` ya no requiere `slot_id` — acepta `slot_start` + `rule_id`, valida vía RPC. BookingWizard, TimeSlots, BookingConfirm, BookingConfirmation actualizados al nuevo Slot type (`slot_start`, `slot_end`, `rule_id`, `max_participants`, `booked`).
- **Directorio consultantes mejorado**: Checkboxes para selección múltiple, botón "Copiar emails" al portapapeles, "Exportar CSV", columna de tags y rol visibles.
- **Email Marketing mejorado**: Filtro por tags en formulario de envío, historial de campañas con dashboard de estadísticas en `/admin/email-marketing`.
- **Sistema de Promos**: Migration 023 (`promotions`, `promotion_sessions`, `promo_purchases`, `email_campaigns`). Admin UI en `/admin/promos` con CRUD, activar/desactivar, filtro por tiers. Sidebar actualizado.

### Blocked
- **MP OAuth connect**: El endpoint `/api/mercadopago/oauth/link` devuelve error "MP OAuth no configurado" a pesar de que `MP_CLIENT_ID` está set en el container. Pendiente debuggear.

## Key Decisions
- **OAuth sobre token directo**: Escalable multi-cliente. Una app developer, cada cliente autoriza vía link. Token refrescable (180 días).
- **4 roles definitivos**: `consultante`, `gerente` (negocio, sin borrar), `admin` (técnico, cambios sensibles requieren owner), `owner` (control total).
- **Disponibilidad por reglas**: `availability_rules_v2` reemplaza `availability_slots`. Reglas semanales (day_of_week) o específicas (specific_date) con modality, session_type, duration. Slots generados dinámicamente por `get_available_slots_v2()`.
- **Strangler fig pattern**: Tablas viejas (`availability_slots`, `availability_rules` v1, `availability_exceptions`, `availability`) siguen funcionando junto a `availability_rules_v2`. Se deprecarán en migration futura.
- **Permisos en código TypeScript**: `isAdmin()` y `isOwner()` desde `@/lib/auth/roles`.
- **Promos**: Tablas `promotions` + `promotion_sessions` + `promo_purchases`. Pago único vía MP preference. Filtro por `allowed_tiers`.

## Next Steps
1. Debuggear MP OAuth: por qué `/api/mercadopago/oauth/link` falla con vars set en container.
2. Agenda reingeniería Fase 5: Admin RuleManager UI (componente de gestión visual de `availability_rules_v2`).
3. Agenda reingeniería Fase 6: Cleanup — renombrar/dropear tablas viejas (solo cuando todo el código migró).
4. User: verificar dominio Resend en Namecheap.
5. User: testear checkout MP con cuenta diferente.

## Relevant Files
- `supabase/migrations/022_availability_rules.sql`: Tabla `availability_rules_v2`, enums extendidos, funciones de slot generation, data migration desde v1.
- `src/app/api/admin/availability/rules/route.ts`: GET (list rules), POST (create rule)
- `src/app/api/admin/availability/rules/[id]/route.ts`: PUT (update), DELETE (solo owner)
- `src/app/api/availability/route.ts`: Endpoint público — usa `get_available_slots_v2()` / `get_available_dates_v2()`.
- `src/app/api/appointments/route.ts`: POST sin slot_id — acepta `slot_start` + `rule_id`, valida vía RPC.
- `src/app/consultantes/reservar/BookingWizard.tsx`: Slot type actualizado, POST con `slot_start`.
- `src/app/consultantes/reservar/TimeSlots.tsx`: Slot type actualizado, filtro por `booked < max_participants`.
- `src/app/consultantes/reservar/BookingConfirm.tsx`: Slot type actualizado con `startLabel`/`endLabel`.
- `src/app/consultantes/reservar/BookingConfirmation.tsx`: Slot type actualizado.
- `supabase/migrations/020_mp_oauth.sql`: Tabla `mp_credentials` + RLS
- `supabase/migrations/021_pending_approvals.sql`: Tabla `pending_approvals` + funciones + rol `gerente`
- `src/lib/mercadopago-oauth.ts`: OAuth utilities
- `src/app/api/mercadopago/oauth/link/route.ts`: GET → redirect a MP auth
- `src/app/api/mercadopago/oauth/callback/route.ts`: GET code → token → guarda en DB
- `src/app/api/mercadopago/oauth/status/route.ts`: GET → { connected, mp_user_id, is_expired }
- `src/app/api/reminders/route.ts`: Cron job + `expire_old_approvals()`
- `src/lib/auth/roles.ts`: `isAdmin()` (admin+owner) + `isOwner()`
- `src/app/api/auth/check-role/route.ts`: Endpoint reconoce owner como admin
- `docs/proposal/PROPUESTA_REINGENIERIA.md`: Propuesta completa RBAC + turnos + promos
