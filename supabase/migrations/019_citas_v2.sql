-- =====================================================
-- MIGRATION 019: Citas v2 — Servicios, Modalidad, Slots
-- =====================================================
BEGIN;

-- =============================================
-- 1. ACTUALIZAR CHECK DE ROLE EN PROFILES
-- =============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('consultante', 'admin', 'owner'));

-- =============================================
-- 2. FUNCIÓN is_owner_user()
-- =============================================
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

-- =============================================
-- 3. ACTUALIZAR is_admin_user() (admins + owners)
-- =============================================
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

-- =============================================
-- 4. MODALIDAD ENUM
-- =============================================
DO $$ BEGIN
  CREATE TYPE modality_type AS ENUM ('online', 'presencial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 5. AGREGAR MODALIDAD A SERVICES
-- =============================================
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allowed_modalities modality_type[] DEFAULT '{"online","presencial"}';

-- =============================================
-- 6. SEED DE SERVICIOS (15)
-- =============================================
TRUNCATE TABLE public.services CASCADE;

INSERT INTO public.services (name, slug, description, duration_minutes, is_active, allowed_modalities) VALUES
  ('Lectura de Registros Akáshicos',    'registros-akashicos',     'Lectura de registros akáshicos', 90,  true, '{online,presencial}'),
  ('Biodecodificación',                  'biodecodificacion',       'Biodecodificación',              60,  true, '{online,presencial}'),
  ('Limpieza Energética con Péndulo',    'limpieza-pendulo',        'Limpieza energética con péndulo',60,  true, '{online,presencial}'),
  ('Armonización de Chakras',            'armonizacion-chakras',    'Armonización de chakras',        60,  true, '{online,presencial}'),
  ('Rondas de Tapping (EFT)',            'tapping-eft',             'Rondas de tapping EFT',          45,  true, '{online,presencial}'),
  ('Meditación Guiada Personalizada',    'meditacion-personalizada','Meditación guiada personalizada', 30,  true, '{online,presencial}'),
  ('Reiki',                              'reiki',                   'Reiki',                          60,  true, '{online,presencial}'),
  ('Masaje Shantala',                    'masaje-shantala',         'Masaje shantala',                45,  true, '{presencial}'),
  ('Sanación de Útero',                  'sanacion-utero',          'Sanación de útero',              90,  true, '{presencial}'),
  ('Rito de Linaje Femenino',            'rito-linaje-femenino',    'Rito de linaje femenino',       120,  true, '{presencial}'),
  ('Yoga para Adultos',                  'yoga-adultos',            'Yoga para adultos',              60,  true, '{presencial}'),
  ('Yoga para Niños',                    'yoga-ninos',              'Yoga para niños',                45,  true, '{presencial}'),
  ('Consultas por Encuentros',           'consultas-encuentros',    'Consultas por encuentros',       30,  true, '{online,presencial}'),
  ('Celebraciones Holísticas',           'celebraciones-holisticas','Celebraciones holísticas',      120,  true, '{presencial}'),
  ('Meditaciones Guiadas',               'meditaciones-guiadas',    'Meditaciones guiadas',           30,  true, '{online,presencial}');

-- =============================================
-- 7. AVAILABILITY SLOTS (NUEVA TABLA)
-- =============================================
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id      uuid REFERENCES public.services(id) ON DELETE CASCADE,
  modality        modality_type NOT NULL,
  slot_date       date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  capacity        integer NOT NULL DEFAULT 1,
  booked_count    integer NOT NULL DEFAULT 0,
  is_available    boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT slots_end_after_start CHECK (end_time > start_time),
  CONSTRAINT slots_capacity_check CHECK (booked_count <= capacity)
);

CREATE INDEX IF NOT EXISTS slots_date_idx ON public.availability_slots (slot_date, modality);
CREATE INDEX IF NOT EXISTS slots_owner_idx ON public.availability_slots (owner_id);
CREATE INDEX IF NOT EXISTS slots_service_idx ON public.availability_slots (service_id);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY slots_select ON public.availability_slots FOR SELECT
USING (true);

CREATE POLICY slots_insert ON public.availability_slots FOR INSERT
WITH CHECK (public.is_owner_user());

CREATE POLICY slots_update ON public.availability_slots FOR UPDATE
USING (public.is_owner_user());

CREATE POLICY slots_delete ON public.availability_slots FOR DELETE
USING (public.is_owner_user());

-- =============================================
-- 8. MODALIDAD + SLOT_ID EN APPOINTMENTS
-- =============================================
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS modality modality_type NOT NULL DEFAULT 'presencial';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.availability_slots(id) ON DELETE SET NULL;

-- =============================================
-- 9. UPDATE create_appointment()
-- =============================================
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
  v_duration_minutes integer;
  v_allowed_modalities modality_type[];
BEGIN
  -- Validar servicio activo
  SELECT duration_minutes, allowed_modalities INTO v_duration_minutes, v_allowed_modalities
  FROM public.services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servicio no encontrado o inactivo';
  END IF;

  -- Validar modalidad permitida
  IF NOT (p_modality = ANY(v_allowed_modalities)) THEN
    RAISE EXCEPTION 'Modalidad no permitida para este servicio';
  END IF;

  -- Validar slot si se especificó
  IF p_slot_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.availability_slots
      WHERE id = p_slot_id
        AND is_available = true
        AND booked_count < capacity
        AND modality = p_modality
        AND slot_date = p_start_time::date
    ) THEN
      RAISE EXCEPTION 'Slot no disponible o sin cupo';
    END IF;
  END IF;

  INSERT INTO public.appointments (
    service_id, consultant_id, client_id, start_time, end_time,
    modality, slot_id, notes, status
  ) VALUES (
    p_service_id, p_consultant_id, p_client_id, p_start_time, p_end_time,
    p_modality, p_slot_id, p_notes, 'pending'
  ) RETURNING id INTO v_appointment_id;

  IF p_slot_id IS NOT NULL THEN
    UPDATE public.availability_slots
    SET booked_count = booked_count + 1
    WHERE id = p_slot_id;
  END IF;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, to_status, metadata)
  VALUES
    (v_appointment_id, p_client_id, 'created', 'pending',
     jsonb_build_object('service_id', p_service_id, 'modality', p_modality));

  RETURN v_appointment_id;
END;
$$;

-- =============================================
-- 10. UPDATE cancel_appointment()
-- =============================================
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
  v_old_status appointment_status;
BEGIN
  SELECT client_id, slot_id, status INTO v_client_id, v_slot_id, v_old_status
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

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
    (p_appointment_id, p_cancelled_by, 'cancelled', v_old_status, 'cancelled',
     jsonb_build_object('reason', p_reason));
END;
$$;

-- =============================================
-- 11. NOTA: dropear exclusion constraint vieja
--     que no considera modality
-- =============================================
-- La exclusion constraint actual en appointments
-- impide overlaps sin considerar modality.
-- Como ahora dos slots de distinta modalidad
-- (online vs presencial) NO deberían solaparse
-- (porque la dueña no puede estar en dos lugares),
-- la constraint actual está bien.
-- Si en el futuro se necesita permitir overlaps
-- por modalidad, se dropea y recrea:
-- DROP INDEX IF EXISTS appointments_overlap_excl;

COMMIT;
