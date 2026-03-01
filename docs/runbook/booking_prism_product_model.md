# PRISM Product Model - Booking System

## System Understanding Summary

- Stack: Next.js App Router + Supabase (Auth + Postgres + RLS).
- Booking entrypoints:
  - `src/app/miembros/reservar/page.tsx`
  - `src/components/BookingCalendar.tsx`
  - `src/app/admin/agenda/page.tsx`
  - `src/actions/agenda.ts`
  - `src/actions/appointments.ts`
- Persistence currently mixed:
  - Legacy tables/policies in `001`-`005` migrations.
  - New booking model in `supabase/migrations/006_appointments_system.sql`:
    - `services`
    - `availability_rules`
    - `availability_exceptions`
    - `appointments` (with `client_id`)
    - `appointment_audit_log`
- Authorization model:
  - Session gate in middleware (`src/middleware.ts`, `src/lib/supabase/middleware.ts`).
  - Admin UI checks in layouts using app metadata (`src/lib/auth/roles.ts`).
  - DB/RLS admin checks in new booking system using `auth.jwt()`.
- Double-booking protection:
  - DB-level `EXCLUDE USING gist` on `appointments` active statuses.
  - Trigger validation through `validate_appointment_write()`.

## Actors and Use Cases

### Actors

- Visitor
- Registered authenticated user
- Member
- Admin
- Consultant (data model role via `consultant_id`; operationally admin-owned schedule)

### Use Cases

1. Reserve appointment
- UI reads availability (`availability_rules`, `availability_exceptions`) and existing appointments.
- UI sends reservation through server action `createAppointment`.
- Server action calls RPC `create_appointment`.
- DB computes end time, validates slot availability, rejects overlap, inserts appointment, logs audit.

2. Configure weekly availability (admin)
- UI submits weekly blocks from `AvailabilityConfig`.
- Server action `saveAvailability` replaces `availability_rules` for consultant.
- Legacy sync still writes to old `availability` table.

3. Add/block specific date availability (admin)
- UI in calendar invokes `saveSpecificSlot`, `blockDate`, `unblockDate`, `deleteSpecificSlot`.
- Actions mutate `availability_exceptions`.

4. Cancel/reschedule/confirm appointment
- Implemented in backend (`cancelAppointment`, `rescheduleAppointment`, `adminConfirmAppointment` + RPCs).
- Member/admin UI integration is still partial.

## Security Analysis

### Current strengths

- Server actions used for writes in new booking path.
- DB-centric concurrency protection (`EXCLUDE` constraint).
- DB trigger rejects outside-availability and past invalid writes.
- JWT-based admin evaluation in booking RLS (`jwt_is_admin()`).

### Risks identified

1. P0: Privilege escalation risk in profiles RLS
- `supabase/migrations/005_performance_and_security_cleanup.sql` has tautological `WITH CHECK` for profile update policy.
- Impact: possible unauthorized updates on sensitive fields (`role`, `is_premium`) depending on policy composition/runtime behavior.

2. P0: Destructive migration behavior
- `006_appointments_system.sql` drops `appointments` and `appointment_audit_log` before recreate.
- Impact: potential data loss without controlled migration strategy.

3. P1: Appointment owner update scope too broad
- Owner update policy in migration 006 allows updates beyond intended transitions.
- Impact: business-state integrity risk.

4. P1: Frontend TOCTOU still present (mitigated)
- Client slot preview can race.
- DB constraint/trigger correctly prevents inconsistent writes.

5. P2: Schema/type drift
- `src/types/database.types.ts` still models legacy `appointments.user_id`.
- Runtime queries now use `client_id` in several places.

6. P2: UX-data mismatch in slot rendering
- Client availability preview only checks `pending` appointments, not all active-conflicting statuses.

## Architectural Assessment

- Architecture type: hybrid SSR + client with Supabase-backed BFF-like server actions.
- Source of truth:
  - Security and consistency should be database-first (RLS/triggers/constraints).
  - Current UI still duplicates scheduling logic client-side.
- Coupling risks:
  - Coexistence of legacy/new scheduling tables.
  - Admin checks split between app metadata checks and DB claims.
  - Outdated generated types increase integration risk.
- Structural technical debt:
  - Incomplete migration path.
  - Partial UI adoption of new booking actions.
  - Missing end-to-end coverage for race/security transitions.

## Prioritized Product Backlog (User Stories)

### P0

#### US-001
Como administrador de plataforma
Quiero políticas RLS de perfiles seguras
Para impedir escalación de privilegios y auto-premium.

Acceptance Criteria
- Given usuario no admin, When intenta cambiar `role`, Then la DB rechaza.
- Given usuario no admin, When intenta cambiar `is_premium`, Then la DB rechaza.
- Given usuario autenticado, When actualiza campos permitidos de perfil, Then la DB acepta.

Business Rules
- Solo administradores pueden gestionar privilegios y premium.

Security Validations
- Enforcement exclusivo por RLS.

Data Requirements
- `profiles.role`, `profiles.is_premium` inmutables para no-admin.

DB Impact
- Nueva migración de políticas `profiles`.

#### US-002
Como owner del producto
Quiero migración no destructiva de citas
Para conservar historial y continuidad operativa.

Acceptance Criteria
- Given citas legacy existentes, When se migra, Then ninguna cita se pierde.
- Given registros legacy con `user_id`, When se migra, Then quedan en `client_id` válidos.

Business Rules
- Historial de agenda no se elimina en despliegue.

Security Validations
- RLS activa durante migración.

Data Requirements
- Backfill de `service_id`, `consultant_id`, `client_id`.

DB Impact
- Reemplazar DROP/CREATE por estrategia incremental + backfill.

#### US-003
Como miembro
Quiero que no existan dobles reservas
Para confiar en la cita confirmada.

Acceptance Criteria
- Given dos requests concurrentes del mismo slot, When se insertan, Then solo una reserva se persiste.

Business Rules
- Estados activos (`pending`, `confirmed`) no pueden solaparse por consultor.

Security Validations
- Control de concurrencia en DB.

Data Requirements
- Rango temporal consistente `[start_time, end_time)`.

DB Impact
- Mantener `EXCLUDE USING gist` + validación trigger.

### P1

#### US-004
Como miembro
Quiero cancelar y reprogramar mis citas desde UI
Para autogestionar mi agenda.

Acceptance Criteria
- Given cita futura propia, When cancelo, Then queda `cancelled`.
- Given cita futura propia y slot libre, When reprogramo, Then se actualiza fecha/hora.
- Given cita pasada, When intento cancelar/reprogramar, Then se rechaza.

Business Rules
- Solo dueño o admin actúan sobre cita.

Security Validations
- Nunca confiar en IDs de cliente desde frontend.

Data Requirements
- Registrar `cancelled_at`, `cancelled_by`, `cancelled_reason`.

DB Impact
- Reutiliza RPCs existentes.

#### US-005
Como administrador
Quiero confirmar citas pendientes desde panel
Para controlar la agenda de atención.

Acceptance Criteria
- Given admin autenticado, When confirma cita futura pendiente, Then queda `confirmed`.
- Given no admin, When intenta confirmar, Then la DB rechaza.

Business Rules
- Confirmación solo para citas futuras.

Security Validations
- Autorización por `auth.jwt()`.

Data Requirements
- `confirmed_at`, `confirmed_by`.

DB Impact
- Reutiliza RPC `admin_confirm_appointment`.

#### US-006
Como miembro
Quiero ver solo slots realmente reservables
Para evitar rechazos al final del flujo.

Acceptance Criteria
- Given un slot con cita activa conflictiva, When se muestra disponibilidad, Then no aparece como libre.

Business Rules
- La disponibilidad final la determina DB, no el cliente.

Security Validations
- Lectura autenticada bajo RLS.

Data Requirements
- Reglas + excepciones + citas activas.

DB Impact
- Posible función SQL de lectura consolidada de slots.

#### US-007
Como sistema
Quiero restringir transiciones de estado de cita por rol
Para proteger integridad del workflow.

Acceptance Criteria
- Given miembro, When intenta setear `confirmed/completed`, Then falla.
- Given admin, When confirma cita pendiente válida, Then éxito.

Business Rules
- Miembro: cancelar/reprogramar.
- Admin: confirmar/completar/no_show según política.

Security Validations
- Reglas de transición validadas en DB.

Data Requirements
- Estado previo y nuevo auditables.

DB Impact
- Trigger/policy de transición explícita.

### P2

#### US-008
Como equipo de desarrollo
Quiero tipos de DB alineados al esquema real
Para evitar errores de integración.

Acceptance Criteria
- Given esquema actual, When se regeneran tipos, Then no quedan referencias a columnas legacy inexistentes.

Business Rules
- Modelo único (`client_id`) para citas.

Security Validations
- N/A.

Data Requirements
- Tipos de `services`, `availability_rules`, `availability_exceptions`, `appointments`, `appointment_audit_log`.

DB Impact
- Ninguno.

#### US-009
Como admin
Quiero una vista de auditoría de citas
Para trazabilidad operativa.

Acceptance Criteria
- Given admin, When abre detalle de cita, Then visualiza historial ordenado de eventos.

Business Rules
- Audit log de solo lectura.

Security Validations
- Acceso solo admin por RLS.

Data Requirements
- `action`, `from_status`, `to_status`, timestamps, actor.

DB Impact
- Potenciales índices adicionales.

### P3

#### US-010
Como miembro
Quiero una sección "Mis Citas"
Para gestionar reservas sin depender del calendario completo.

Acceptance Criteria
- Given miembro con citas futuras, When entra a la sección, Then ve listado y acciones disponibles.

Business Rules
- Solo citas propias.

Security Validations
- Lectura por RLS (`client_id = auth.uid()`).

Data Requirements
- Consulta paginada por fecha y estado.

DB Impact
- Ninguno.

## Notes for Execution

- Mantener enfoque DB-first: RLS + constraints + triggers como capa final de seguridad.
- Eliminar progresivamente writes/reads legacy (`availability`, `appointments.user_id`).
- Definir secuencia segura de migración de datos antes de nuevos despliegues en producción.
