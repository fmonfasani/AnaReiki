# Plan de Implementación — Sistema de Citas (Prioridad 1)

## 1. Modelo de Datos (Migración 019)

```sql
-- ============================
-- 1. CATÁLOGO DE SERVICIOS (15)
-- ============================
TRUNCATE public.services CASCADE;
INSERT INTO public.services (name, slug, description, duration_minutes, is_active) VALUES
  ('Lectura de Registros Akáshicos',    'registros-akashicos',     '', 90,  true),
  ('Biodecodificación',                  'biodecodificacion',       '', 60,  true),
  ('Limpieza Energética con Péndulo',    'limpieza-pendulo',        '', 60,  true),
  ('Armonización de Chakras',            'armonizacion-chakras',    '', 60,  true),
  ('Rondas de Tapping (EFT)',            'tapping-eft',             '', 45,  true),
  ('Meditación Guiada Personalizada',    'meditacion-personalizada','', 30,  true),
  ('Reiki',                              'reiki',                   '', 60,  true),
  ('Masaje Shantala',                    'masaje-shantala',         '', 45,  true),
  ('Sanación de Útero',                  'sanacion-utero',          '', 90,  true),
  ('Rito de Linaje Femenino',            'rito-linaje-femenino',    '', 120, true),
  ('Yoga para Adultos',                  'yoga-adultos',            '', 60,  true),
  ('Yoga para Niños',                    'yoga-ninos',              '', 45,  true),
  ('Consultas por Encuentros',           'consultas-encuentros',    '', 30,  true),
  ('Celebraciones Holísticas',           'celebraciones-holisticas','', 120, true),
  ('Meditaciones Guiadas',               'meditaciones-guiadas',    '', 30,  true);

-- ============================
-- 2. MODALIDAD ENUM
-- ============================
CREATE TYPE modality_type AS ENUM ('online', 'presencial');

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allowed_modalities modality_type[] DEFAULT '{"online","presencial"}';

-- ============================
-- 3. BLOQUES DE DISPONIBILIDAD (NUEVO)
-- ============================
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id      uuid REFERENCES public.services(id) ON DELETE CASCADE,  -- NULL = cualquier servicio
  modality        modality_type NOT NULL,
  slot_date       date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  capacity        integer NOT NULL DEFAULT 1,           -- cupo: cuántas personas pueden reservar este slot
  booked_count    integer NOT NULL DEFAULT 0,           -- cuántas ya reservaron
  is_available    boolean NOT NULL DEFAULT true,        -- false = bloqueado manualmente
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slots_end_after_start CHECK (end_time > start_time),
  CONSTRAINT slots_capacity_check CHECK (booked_count <= capacity)
);

-- Índices
CREATE INDEX slots_date_idx ON public.availability_slots (slot_date, modality);
CREATE INDEX slots_owner_idx ON public.availability_slots (owner_id);
CREATE INDEX slots_service_idx ON public.availability_slots (service_id);

-- ============================
-- 4. ACTUALIZAR APPOINTMENTS
-- ============================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS modality modality_type NOT NULL DEFAULT 'presencial';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.availability_slots(id) ON DELETE SET NULL;

-- ============================
-- 5. RLS
-- ============================
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY slots_select ON public.availability_slots FOR SELECT
USING (true);  -- todos ven slots disponibles

CREATE POLICY slots_insert ON public.availability_slots FOR INSERT
WITH CHECK (public.is_owner_user());  -- solo owner

CREATE POLICY slots_update ON public.availability_slots FOR UPDATE
USING (public.is_owner_user());       -- solo owner

CREATE POLICY slots_delete ON public.availability_slots FOR DELETE
USING (public.is_owner_user());       -- solo owner

-- ============================
-- 6. NUEVA FUNCIÓN is_owner_user()
-- ============================
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- ============================
-- 7. CHECK de profiles.role
-- ============================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('consultante', 'admin', 'owner'));

-- ============================
-- 8. is_admin_user() actualizado
-- ============================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
  );
$$;

-- ============================
-- 9. ACTUALIZAR create_appointment()
-- ============================
CREATE OR REPLACE FUNCTION public.create_appointment(
  p_service_id uuid,
  p_consultant_id uuid,
  p_client_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_modality modality_type DEFAULT 'presencial',
  p_slot_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_appointment_id uuid;
BEGIN
  -- Validar que el slot existe y tiene cupo
  IF p_slot_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.availability_slots
      WHERE id = p_slot_id
        AND is_available = true
        AND booked_count < capacity
    ) THEN
      RAISE EXCEPTION 'Slot no disponible o sin cupo';
    END IF;
  END IF;

  INSERT INTO public.appointments (
    service_id, consultant_id, client_id,
    start_time, end_time, modality, slot_id,
    notes, status
  ) VALUES (
    p_service_id, p_consultant_id, p_client_id,
    p_start_time, p_end_time, p_modality, p_slot_id,
    p_notes, 'pending'
  ) RETURNING id INTO v_appointment_id;

  -- Incrementar booked_count
  IF p_slot_id IS NOT NULL THEN
    UPDATE public.availability_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id;
  END IF;

  -- Audit log
  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, to_status, metadata)
  VALUES
    (v_appointment_id, p_client_id, 'created', 'pending',
     jsonb_build_object('service_id', p_service_id, 'modality', p_modality));

  RETURN v_appointment_id;
END;
$$;

-- ============================
-- 10. UPDATE cancel_appointment()
-- ============================
CREATE OR REPLACE FUNCTION public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text DEFAULT NULL,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id uuid;
  v_slot_id uuid;
BEGIN
  SELECT client_id, slot_id INTO v_client_id, v_slot_id
  FROM public.appointments WHERE id = p_appointment_id;

  IF p_cancelled_by IS NULL THEN
    p_cancelled_by := auth.uid();
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_reason = p_reason,
      cancelled_at = now(),
      cancelled_by = p_cancelled_by
  WHERE id = p_appointment_id;

  -- Liberar cupo del slot
  IF v_slot_id IS NOT NULL THEN
    UPDATE public.availability_slots
    SET booked_count = GREATEST(booked_count - 1, 0)
    WHERE id = v_slot_id;
  END IF;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status, metadata)
  VALUES
    (p_appointment_id, p_cancelled_by, 'cancelled', 'confirmed', 'cancelled',
     jsonb_build_object('reason', p_reason));
END;
$$;
```

---

## 2. APIs REST

### Servicios
```
GET    /api/services              → Lista servicios activos
GET    /api/services/:id          → Detalle de servicio
POST   /api/admin/services        → Crear servicio (admin/owner)
PUT    /api/admin/services/:id    → Editar servicio
DELETE /api/admin/services/:id    → Desactivar servicio
```

### Disponibilidad (bloques)
```
GET    /api/availability?date=YYYY-MM-DD&modality=online|presencial
       → Bloques disponibles para una fecha
GET    /api/availability/range?from=FECHA&to=FECHA&service_id=X
       → Calendario completo (para el wizard)

POST   /api/admin/availability/slots
       → Crear bloque(s). Body:
         { "date": "2026-06-15", "start": "16:00", "end": "18:00",
           "modality": "online", "service_id": null, "capacity": 1 }
POST   /api/admin/availability/slots/batch
       → Crear múltiples bloques (semana completa). Body:
         { "monday": [{"start":"16:00","end":"17:00"},...],
           "modality": "online", "service_id": null, "week_start": "2026-06-08" }
PUT    /api/admin/availability/slots/:id
       → Editar bloque (cambiar hora, modalidad, capacidad)
DELETE /api/admin/availability/slots/:id
       → Eliminar bloque
PUT    /api/admin/availability/slots/:id/toggle
       → Marcar como disponible/no disponible (sin eliminar)
```

### Reservas (cliente)
```
POST   /api/appointments
       → Crear reserva. Body:
         { "service_id": "...", "slot_id": "...",
           "modality": "online", "date": "2026-06-15", "time": "16:00" }
GET    /api/appointments/mine
       → Mis reservas (próximas + historial)
PUT    /api/appointments/:id/cancel
       → Cancelar reserva. Body: { "reason": "..." }
PUT    /api/appointments/:id/reschedule
       → Reprogramar. Body: { "new_slot_id": "..." }
```

### Admin/Owner — Reservas
```
GET    /api/admin/appointments
       → Todas las reservas (filtrable por status, fecha, servicio)
GET    /api/admin/appointments/:id
       → Detalle de reserva
PUT    /api/admin/appointments/:id/confirm
       → Confirmar reserva
PUT    /api/admin/appointments/:id/complete
       → Marcar como completada
PUT    /api/admin/appointments/:id/cancel
       → Cancelar (admin). Body: { "reason": "..." }
PUT    /api/admin/appointments/:id/no-show
       → Marcar como no-show
```

---

## 3. Flujo UX — Wizard de Reserva (6 pasos)

```
Paso 1: Seleccionar Servicio
  ┌─────────────────────────────────────────────┐
  │  ¿Qué servicio querés reservar?              │
  │                                              │
  │  [Icono] Reiki                    → 60 min   │
  │  [Icono] Masaje Shantala          → 45 min   │
  │  [Icono] Yoga para Adultos        → 60 min   │
  │  [Icono] ...                                 │
  │                                              │
  │  (Scroll, tarjetas con íconos + duración)    │
  └─────────────────────────────────────────────┘

Paso 2: Seleccionar Modalidad
  ┌─────────────────────────────────────────────┐
  │  ¿Cómo preferís tomar la sesión?             │
  │                                              │
  │  ┌──────────┐        ┌──────────┐            │
  │  │  💻      │        │  🏠      │            │
  │  │ Online   │        │Presencial│            │
  │  │ Zoom/Meet│        │En el lugar│            │
  │  └──────────┘        └──────────┘            │
  └─────────────────────────────────────────────┘

Paso 3: Calendario
  ┌─────────────────────────────────────────────┐
  │  Elegí una fecha                             │
  │                                              │
  │  [Junio 2026               <    >]           │
  │  Lu  Ma  Mi  Ju  Vi  Sa  Do                 │
  │       1   2   3   4   5   6                  │
  │   7   8   9  10  11  12  13                  │
  │  14  [15] 16  17  18  19  20                 │
  │  ...                                         │
  │  (Días con disponibilidad resaltados)        │
  └─────────────────────────────────────────────┘

Paso 4: Seleccionar Horario
  ┌─────────────────────────────────────────────┐
  │  Horarios disponibles — 15/06/2026           │
  │  Online                                      │
  │                                              │
  │  [16:00 - 17:00]  [17:00 - 18:00]           │
  │  [18:00 - 19:00]                             │
  │  (Según duración del servicio seleccionado)  │
  └─────────────────────────────────────────────┘

Paso 5: Confirmar
  ┌─────────────────────────────────────────────┐
  │  Resumen de tu reserva                       │
  │                                              │
  │  Servicio:  Reiki                            │
  │  Modalidad: Online                           │
  │  Fecha:     15/06/2026                       │
  │  Horario:   16:00 - 17:00                    │
  │  Duración:  60 min                           │
  │                                              │
  │  [📩 Recibir confirmación por email]          │
  │                                              │
  │  ┌────────────────────────────┐              │
  │  │  Confirmar Reserva         │              │
  │  └────────────────────────────┘              │
  └─────────────────────────────────────────────┘

Paso 6: Comprobante
  ┌─────────────────────────────────────────────┐
  │  ✅ Reserva confirmada                       │
  │                                              │
  │  Te enviamos los detalles a tu email.         │
  │                                              │
  │  Servicio:  Reiki                            │
  │  Modalidad: Online                           │
  │  Fecha:     15/06/2026                       │
  │  Horario:   16:00 - 17:00                    │
  │  Código:    #RE-20260615-001                 │
  │                                              │
  │  [Ir a Mis Citas]  [Agregar a Calendario]    │
  └─────────────────────────────────────────────┘
```

---

## 4. Admin — Gestión de Disponibilidad

```
Panel Admin > Agenda > Disponibilidad

┌─────────────────────────────────────────────────────┐
│  [Semanal]  [Mensual]    [Junio 2026]                │
│                                                       │
│  ┌─────────┬───────────┬──────────────┬──────────┐   │
│  │  Fecha  │  Horario  │  Modalidad   │ Acciones │   │
│  ├─────────┼───────────┼──────────────┼──────────┤   │
│  │ Lun 08  │ 16-17     │ 💻 Online    │ ✏️ 🗑️    │   │
│  │ Lun 08  │ 17-18     │ 💻 Online    │ ✏️ 🗑️    │   │
│  │ Mar 09  │ 16-17     │ 💻 Online    │ ✏️ 🗑️    │   │
│  │ Mar 09  │ 17-18     │ 💻 Online    │ ✏️ 🗑️    │   │
│  │ Mié 10  │ [BLOQUEADO]             │ ✏️ 🗑️    │   │
│  │ Jue 11  │ 10-11     │ 🏠 Presencial│ ✏️ 🗑️    │   │
│  │ Jue 11  │ 11-12     │ 🏠 Presencial│ ✏️ 🗑️    │   │
│  │ Vie 12  │ [BLOQUEADO]             │ ✏️ 🗑️    │   │
│  └─────────┴───────────┴──────────────┴──────────┘   │
│                                                       │
│  [+ Agregar Bloque]  [+ Bloquear Fecha]              │
│                                                       │
│  Modalidad: [Online ▼]   Servicio: [Todos ▼]          │
│  ┌────────────────────────────────────────────┐       │
│  │ Generar Semana Completa                     │       │
│  │ Lunes a Viernes | 16:00 a 18:00 | Online    │       │
│  └────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 5. Tareas Técnicas

### Backend (orden de implementación)

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Migration 019: `services` seed, `modality_type`, `availability_slots`, `is_owner_user()`, actualizar `create_appointment`/`cancel_appointment`, RLS | `supabase/migrations/019_citas_v2.sql` |
| 2 | Setear `murat.anaj@gmail.com` como owner | SQL directo |
| 3 | API: `GET /api/services` | `src/app/api/services/route.ts` |
| 4 | API: `GET /api/availability?date=&modality=` | `src/app/api/availability/route.ts` |
| 5 | API: `POST /api/appointments` (crear reserva) | `src/app/api/appointments/route.ts` |
| 6 | API: `GET /api/appointments/mine` | `src/app/api/appointments/mine/route.ts` |
| 7 | API: `PUT /api/appointments/:id/cancel` | `src/app/api/appointments/[id]/cancel/route.ts` |
| 8 | API: `PUT /api/appointments/:id/reschedule` | `src/app/api/appointments/[id]/reschedule/route.ts` |
| 9 | API Admin: CRUD `availability_slots` + batch | `src/app/api/admin/availability/slots/route.ts` |
| 10 | API Admin: CRUD `services` | `src/app/api/admin/services/route.ts` |
| 11 | API Admin: `GET/PUT appointments` (gestionar) | `src/app/api/admin/appointments/route.ts` |
| 12 | Server actions: `createAppointment`, `cancelAppointment`, etc. | `src/actions/appointments.ts` (actualizar) |
| 13 | Email: enviar confirmación al reservar | `src/app/api/appointments/confirm-email.ts` |

### Frontend (orden)

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | **Wizard paso 1**: Selector de servicios | `src/app/consultantes/reservar/ServiceSelector.tsx` |
| 2 | **Wizard paso 2**: Selector de modalidad | `src/app/consultantes/reservar/ModalitySelector.tsx` |
| 3 | **Wizard paso 3**: Calendario (react-day-picker) | `src/app/consultantes/reservar/DatePicker.tsx` |
| 4 | **Wizard paso 4**: Selector de horario | `src/app/consultantes/reservar/TimeSlots.tsx` |
| 5 | **Wizard paso 5**: Confirmación | `src/app/consultantes/reservar/BookingConfirm.tsx` |
| 6 | **Wizard paso 6**: Comprobante | `src/app/consultantes/reservar/BookingConfirmation.tsx` |
| 7 | **Container del wizard** (maneja estado entre pasos) | `src/app/consultantes/reservar/BookingWizard.tsx` |
| 8 | **Rediseñar** `mis-citas` para nuevo formato | `src/app/consultantes/mis-citas/` |
| 9 | **Admin**: Gestión de servicios (CRUD) | `src/app/admin/agenda/ServiceManager.tsx` |
| 10 | **Admin**: Gestión de slots (calendario + batch) | `src/app/admin/agenda/SlotManager.tsx` |
| 11 | **Admin**: Gestión de reservas (confirmar/completar/cancelar) | `src/app/admin/agenda/AppointmentManager.tsx` |
| 12 | **Paso 1 Cambio suscripciones**: Solo plan gratuito activo, paid "Próximamente" | `src/app/consultantes/suscripciones/` |
| 13 | **Notificaciones email**: confirmación + cancelación + reprogramación | `src/app/api/notifications/` |

---

## 6. Suscripciones (Cambio 1)

Solo tocar `PremiumUpgrade.tsx` y `page.tsx`:

- `isPremium` = `false` para todos
- `planTier` = `prana` para todos
- Grilla de 3 tiers visible, pero Shakti y Ananda con badge **"Próximamente"** y botón deshabilitado
- Texto: *"Esta funcionalidad estará disponible próximamente"*

---

## 7. Resumen de Prioridades

```
Semana 1:
  ├── Migration 019 + seed services + setear owner
  ├── API services + API availability
  └── Wizard pasos 1 y 2 (servicio + modalidad)

Semana 2:
  ├── API appointments (crear, mis citas, cancelar)
  ├── Wizard pasos 3, 4, 5 (calendario, horario, confirmar)
  └── Admin: CRUD slots + batch

Semana 3:
  ├── Admin: gestión de reservas
  ├── Mis citas (refactor)
  ├── Emails de confirmación
  └── Suscripciones: solo free + "Próximamente"
```

---

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Exclusion constraint actual en appointments puede bloquear migración | Alto | Dropear y recrear considerando modality |
| El viejo BookingCalendar.tsx (442 líneas) convive con el nuevo wizard | Medio | No romperlo hasta que el wizard esté completo |
| RLS: consultantes no pueden ver otros profiles (necesitan ver nombre de owner) | Medio | `availability_slots` SELECT policy = true (público para fechas disponibles) |
| Resend requiere dominio verificado para enviar emails | Alto | Ya iniciamos el proceso DNS |
