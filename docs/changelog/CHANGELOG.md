# Changelog

Todos los cambios significativos del proyecto AnaReiki se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [v2.9.9] — 2026-06-05

### Added: Payment Flow Complete
- **Migration 030**: Unifica migrations 027-029 en un solo script idempotente (`IF NOT EXISTS`/`IF EXISTS`). Incluye `price_cents`, `payment_status` (pending/pending_payment/paid/refunded), `mp_preference_id`, `mp_payment_id` en appointments; fix `cancel_appointment` overload; enum `pending_payment`; función `confirm_appointment_payment()`. Ejecutada en Supabase Dashboard.
- **Admin Servicios UI** (`/admin/servicios`): editor de precios por servicio (solo owner). Sidebar actualizado.
- **Retry Payment**: Endpoint `POST /api/appointments/retry-payment` + botón "Reintentar pago" en MisCitasClient para turnos con `pending_payment`.
- **MP Webhook IPN**: `POST /api/mercadopago/webhook` escucha notificaciones de MP, actualiza `payment_status` a `paid`. Test suite agregado.
- **notificationUrl**: `createPaymentPreference()` en `mercadopago.ts` acepta `notificationUrl` opcional.
- **Pending Payment Cleanup**: Turnos con `pending_payment` > 30 min se cancelan vía cron (`expire_old_approvals()`).
- **MP OAuth Resuelto**: `MP_CLIENT_ID` y `MP_CLIENT_SECRET` verificados en container. Owner (Ana) conectó exitosamente. 5 tokens activos.

## [v2.9.8] — 2026-06-04

### Added: Dashboard Enhancement
- **Migration 029**: Tablas `oracle_quotes` (20 frases seed), `session_history` (bitácora), `streak_milestones` (racha automática).
- **Admin Frases** (`/admin/frases`): CRUD completo de frases del oráculo.
- **Dashboard**: Oráculo desde DB, hitos de racha (🌱7, 🌿30, 🌳60...), entradas de bitácora.
- **Evolución**: Tab "Bitácora" con self-journal (título, notas, mood antes/después, privacidad) en línea de tiempo.
- **API oráculo**: `GET/POST /api/admin/oracle-quotes`, `GET/POST /api/session-history`.

## [v2.9.7] — 2026-06-04

### Added: Service Pricing + Payment Flow
- **Migration 027**: `price_cents` en services, `payment_status`/`mp_preference_id`/`mp_payment_id` en appointments.
- **Migration 028**: Fix `cancel_appointment` overload — dropea función vieja (2 params), reemplaza con 3 params retornando `appointments` row.
- `POST /api/appointments` crea preferencia MP si tiene precio, devuelve `mp_init_point`.
- `POST /api/appointments/confirm-payment` verifica pago post-redirect.
- BookingWizard redirige a MP. BookingConfirm muestra precio. ServiceSelector muestra precio/gratuito.
- **PremiumGate refactorizado**: acepta `requiredTier`/`userTier` en vez de `isPremium`.
- **Layout fallback**: Si `plan_tier !== 'prana'` pero `is_premium === false`, fuerza a `prana`. Migration 026 corrige funciones de pago.

## [v2.9.6] — 2026-06-03

### Added: Promos + Email Marketing Stats
- **Migration 023**: Tablas `promotions`, `promotion_sessions`, `promo_purchases`, `email_campaigns`.
- **Admin Promos** (`/admin/promos`): CRUD, activar/desactivar, filtro por tiers. Sidebar actualizado.
- **Email Marketing**: Filtro por tags, historial de campañas con dashboard de estadísticas.

## [v2.9.5] — 2026-06-02

### Added: Comunidad + Reingeniería Agenda
- **Migration 022**: `availability_rules_v2`, slot generation functions, data migration desde v1 (strangler fig).
- **Agenda Fases 1-4**: Reglas semanales/específicas, API CRUD admin, GET /api/availability migrado a v2, POST /api/appointments sin slot_id.
- **Comunidad**: Categorías con colores, eliminar posts propios/en ajenos, admin responde público/privado. Filtros con color.

## [v2.9.0] — 2026-04-15

### Added: Email Marketing + Directorio
- **Notificaciones email**: `src/lib/email.ts` con templates HTML (confirmación, cancelación, reprogramación).
- **Auth hardening**: middleware verifica rol admin/owner en `/admin`.
- **Reminders**: `/api/reminders` con CRON_SECRET + `expire_old_approvals()`. Cron activo 8 AM.
- **Directorio consultantes**: Checkboxes, "Copiar emails", "Exportar CSV", tags y rol visibles.

## [v2.8.0] — 2026-03-15

### Added: MP OAuth + Roles
- **Migration 020**: Tabla `mp_credentials` + RLS.
- **Migration 021**: `pending_approvals` + rol `gerente`.
- **OAuth multi-cliente**: link, callback, status endpoints.
- **Roles TypeScript**: `isAdmin()`, `isOwner()`. Admin layout bug corregido.
- **Owner asignado**: `fmonfasani@gmail.com` como owner.
- **MP OAuth button UI**: Banner "Conectar Mercado Pago" en `/admin/pagos`.

## [v2.7.0] — 2026-03-01: Sistema de Agentes Autónomos

#### Agent System (`agent/`)
- `agent/watcher.js` — Monitor de cambios en `src/`: audita con Codex, corre lint, hace autofix y commit automático
- `agent/buildWatcher.js` — Build cíclico cada 10 minutos con autofix via Codex si falla
- `agent/guardian.js` — Watcher liviano: solo Codex review on change (sin pipeline)
- `agent/nightly.js` — Tarea cron diaria a las 3AM: scan completo → fix → build → lint → commit
- `agent/team.js` — 3 agentes concurrentes con roles: Guardian (bugs) / Builder (features) / Tester (tests)
- `agent/README.md` — Documentación completa del sistema de agentes

#### Workspace de Agentes (`.codex/`)
- `.codex/skills/filesystem.md` — Skill: mapa de rutas, componentes e inventario del proyecto
- `.codex/skills/git.md` — Skill: comandos git, detección de regresiones
- `.codex/skills/shell.md` — Skill: npm scripts, linter, TypeScript check
- `.codex/skills/test.md` — Skill: guía de setup Vitest (test runner pendiente)
- `.codex/mcp.json` — Actualizado con skills registry, context files y metadatos del proyecto
- `.codex/PROJECT_MEMORY.md` — Mapa semántico: entrypoints, modelos, componentes, code smells

#### Documentación
- `AGENTS.md` — Contexto primario para agentes: arquitectura, DB schema, auth flow, env vars, patrones
- `docs/runbook/agent_system.md` — Runbook completo del sistema de agentes
- `docs/adr/ADR-001-agent-system.md` — Registro de decisión arquitectónica

### Security & Hardening — 2026-03-01
- **Fix Security Audit**: Resuelta la vulnerabilidad de escalación de privilegios (user -> admin) mediante restricción RLS en `public.profiles`.
- **Migration 004**: Creada migración de endurecimiento que alinea el esquema (`availability`, `appointments`) con las expectativas del código.
- **Server Actions Secure**: Implementado `isAdminFromAppMetadata` check en todos los actions sensibles de agenda.
- **Bug Fixes**: Corregido stall de carga en `/miembros/reservar` y manejo de errores en `LogoutButton`.
- **MCP Fully Operational**: Activado `config.toml` con servers `filesystem` y `git`, permitiendo a Codex actuar de forma operativa en el repo.

---

## Versiones anteriores

> Los cambios previos al 2026-03-01 no están registrados en este changelog.
> Consultar `git log` para historial completo.
