-- =====================================================
-- MIGRATION: 005 Appointments System
-- Description: Robust therapeutic scheduling with RLS-first authorization
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR ((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'),
    false
  );
$$;

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  buffer_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 120),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.availability_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (end_time > start_time)
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_rules_unique_window_idx
  ON public.availability_rules (consultant_id, COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::uuid), day_of_week, start_time, end_time);

CREATE TABLE IF NOT EXISTS public.availability_exceptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (end_time > start_time)
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_exceptions_unique_window_idx
  ON public.availability_exceptions (consultant_id, COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::uuid), exception_date, start_time, end_time, is_available);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'appointment_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
  END IF;
END
$$;

DROP TABLE IF EXISTS public.appointment_audit_log;
DROP TABLE IF EXISTS public.appointments;

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes text,
  cancelled_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (end_time > start_time),
  CHECK ((date_trunc('day', start_time) = date_trunc('day', end_time)))
);

CREATE INDEX appointments_consultant_start_idx ON public.appointments (consultant_id, start_time);
CREATE INDEX appointments_client_start_idx ON public.appointments (client_id, start_time);
CREATE INDEX appointments_status_start_idx ON public.appointments (status, start_time);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap_active
  EXCLUDE USING gist (
    consultant_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

CREATE TABLE public.appointment_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status public.appointment_status,
  to_status public.appointment_status,
  old_start_time timestamptz,
  new_start_time timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX appointment_audit_log_appt_idx ON public.appointment_audit_log (appointment_id, created_at DESC);

INSERT INTO public.services (slug, name, description, duration_minutes, buffer_minutes, is_active)
SELECT 'reiki-integral', 'Sesion Reiki Integral', 'Sesion terapeutica de Reiki', 60, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.services);

INSERT INTO public.availability_rules (consultant_id, day_of_week, start_time, end_time, is_active)
SELECT a.consultant_id, a.day_of_week, a.start_time, a.end_time, true
FROM public.availability a
WHERE a.consultant_id IS NOT NULL
  AND a.is_available = true
  AND a.specific_date IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.availability_rules r
    WHERE r.consultant_id = a.consultant_id
      AND r.day_of_week = a.day_of_week
      AND r.start_time = a.start_time
      AND r.end_time = a.end_time
      AND r.service_id IS NULL
  );

INSERT INTO public.availability_exceptions (consultant_id, exception_date, start_time, end_time, is_available)
SELECT a.consultant_id, a.specific_date, a.start_time, a.end_time, a.is_available
FROM public.availability a
WHERE a.consultant_id IS NOT NULL
  AND a.specific_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.availability_exceptions e
    WHERE e.consultant_id = a.consultant_id
      AND e.exception_date = a.specific_date
      AND e.start_time = a.start_time
      AND e.end_time = a.end_time
      AND e.is_available = a.is_available
      AND e.service_id IS NULL
  );

CREATE OR REPLACE FUNCTION public.appointment_slot_is_available(
  p_consultant_id uuid,
  p_service_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_date date;
  v_start_time time;
  v_end_time time;
  v_day_of_week integer;
  v_has_allow_exception boolean;
  v_has_block_exception boolean;
  v_has_rule boolean;
  v_has_overlap boolean;
BEGIN
  v_date := (p_start AT TIME ZONE 'UTC')::date;
  v_start_time := (p_start AT TIME ZONE 'UTC')::time;
  v_end_time := (p_end AT TIME ZONE 'UTC')::time;
  v_day_of_week := EXTRACT(DOW FROM (p_start AT TIME ZONE 'UTC'))::integer;

  SELECT EXISTS (
    SELECT 1
    FROM public.availability_exceptions e
    WHERE e.consultant_id = p_consultant_id
      AND (e.service_id IS NULL OR e.service_id = p_service_id)
      AND e.exception_date = v_date
      AND e.is_available = false
      AND e.start_time < v_end_time
      AND e.end_time > v_start_time
  ) INTO v_has_block_exception;

  IF v_has_block_exception THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.availability_exceptions e
    WHERE e.consultant_id = p_consultant_id
      AND (e.service_id IS NULL OR e.service_id = p_service_id)
      AND e.exception_date = v_date
      AND e.is_available = true
      AND e.start_time <= v_start_time
      AND e.end_time >= v_end_time
  ) INTO v_has_allow_exception;

  IF NOT v_has_allow_exception THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.availability_rules r
      WHERE r.consultant_id = p_consultant_id
        AND r.is_active = true
        AND (r.service_id IS NULL OR r.service_id = p_service_id)
        AND r.day_of_week = v_day_of_week
        AND r.start_time <= v_start_time
        AND r.end_time >= v_end_time
    ) INTO v_has_rule;

    IF NOT v_has_rule THEN
      RETURN false;
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.consultant_id = p_consultant_id
      AND a.status IN ('pending', 'confirmed')
      AND (p_exclude_appointment_id IS NULL OR a.id <> p_exclude_appointment_id)
      AND tstzrange(a.start_time, a.end_time, '[)') && tstzrange(p_start, p_end, '[)')
  ) INTO v_has_overlap;

  IF v_has_overlap THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_appointment_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'Invalid time range';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.start_time <= timezone('utc'::text, now()) THEN
      RAISE EXCEPTION 'Cannot book appointments in the past';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.start_time <= timezone('utc'::text, now()) THEN
      RAISE EXCEPTION 'Past appointments cannot be updated';
    END IF;
  END IF;

  IF NEW.status IN ('pending', 'confirmed') THEN
    IF NOT public.appointment_slot_is_available(
      NEW.consultant_id,
      NEW.service_id,
      NEW.start_time,
      NEW.end_time,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    ) THEN
      RAISE EXCEPTION 'Appointment is outside availability or overlaps another booking';
    END IF;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_appointment_write ON public.appointments;
CREATE TRIGGER trg_validate_appointment_write
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_write();

CREATE OR REPLACE FUNCTION public.log_appointment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_audit_log (
      appointment_id,
      actor_user_id,
      action,
      to_status,
      new_start_time,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NEW.status,
      NEW.start_time,
      jsonb_build_object('service_id', NEW.service_id, 'consultant_id', NEW.consultant_id)
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.appointment_audit_log (
      appointment_id,
      actor_user_id,
      action,
      from_status,
      to_status,
      old_start_time,
      new_start_time,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      CASE
        WHEN OLD.status <> NEW.status AND NEW.status = 'cancelled' THEN 'cancelled'
        WHEN OLD.status <> NEW.status AND NEW.status = 'confirmed' THEN 'confirmed'
        WHEN OLD.start_time <> NEW.start_time THEN 'rescheduled'
        ELSE 'updated'
      END,
      OLD.status,
      NEW.status,
      OLD.start_time,
      NEW.start_time,
      jsonb_build_object('old_end_time', OLD.end_time, 'new_end_time', NEW.end_time)
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_appointment_change ON public.appointments;
CREATE TRIGGER trg_log_appointment_change
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.log_appointment_change();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_read_authenticated ON public.services;
DROP POLICY IF EXISTS services_admin_all ON public.services;
CREATE POLICY services_read_authenticated
ON public.services
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY services_admin_all
ON public.services
FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS availability_rules_read_authenticated ON public.availability_rules;
DROP POLICY IF EXISTS availability_rules_admin_all ON public.availability_rules;
CREATE POLICY availability_rules_read_authenticated
ON public.availability_rules
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY availability_rules_admin_all
ON public.availability_rules
FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS availability_exceptions_read_authenticated ON public.availability_exceptions;
DROP POLICY IF EXISTS availability_exceptions_admin_all ON public.availability_exceptions;
CREATE POLICY availability_exceptions_read_authenticated
ON public.availability_exceptions
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY availability_exceptions_admin_all
ON public.availability_exceptions
FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

DROP POLICY IF EXISTS appointments_select_owner_or_admin ON public.appointments;
DROP POLICY IF EXISTS appointments_insert_owner ON public.appointments;
DROP POLICY IF EXISTS appointments_update_owner_future_only ON public.appointments;
DROP POLICY IF EXISTS appointments_admin_all ON public.appointments;

CREATE POLICY appointments_select_owner_or_admin
ON public.appointments
FOR SELECT
USING ((auth.uid() = client_id) OR public.jwt_is_admin());

CREATE POLICY appointments_insert_owner
ON public.appointments
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND start_time > timezone('utc'::text, now())
  AND public.appointment_slot_is_available(consultant_id, service_id, start_time, end_time, NULL)
);

CREATE POLICY appointments_update_owner_future_only
ON public.appointments
FOR UPDATE
USING (
  auth.uid() = client_id
  AND start_time > timezone('utc'::text, now())
)
WITH CHECK (
  auth.uid() = client_id
  AND start_time > timezone('utc'::text, now())
  AND public.appointment_slot_is_available(consultant_id, service_id, start_time, end_time, id)
);

CREATE POLICY appointments_admin_all
ON public.appointments
FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (
  public.jwt_is_admin()
  AND start_time > timezone('utc'::text, now())
);

DROP POLICY IF EXISTS appointment_audit_log_admin_read ON public.appointment_audit_log;
CREATE POLICY appointment_audit_log_admin_read
ON public.appointment_audit_log
FOR SELECT
USING (public.jwt_is_admin());

CREATE OR REPLACE FUNCTION public.create_appointment(
  p_service_id uuid,
  p_consultant_id uuid,
  p_start_time timestamptz,
  p_notes text DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor uuid;
  v_service public.services%ROWTYPE;
  v_end_time timestamptz;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_service
  FROM public.services
  WHERE id = p_service_id
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  v_end_time := p_start_time + make_interval(mins => v_service.duration_minutes);

  INSERT INTO public.appointments (
    service_id,
    consultant_id,
    client_id,
    start_time,
    end_time,
    status,
    notes
  ) VALUES (
    p_service_id,
    p_consultant_id,
    v_actor,
    p_start_time,
    v_end_time,
    'pending',
    NULLIF(trim(p_notes), '')
  )
  RETURNING * INTO v_appointment;

  RETURN v_appointment;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Selected slot is already booked';
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor uuid;
  v_is_admin boolean;
  v_current public.appointments%ROWTYPE;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := auth.uid();
  v_is_admin := public.jwt_is_admin();

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_current
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF v_current.start_time <= timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Past appointments cannot be updated';
  END IF;

  IF NOT v_is_admin AND v_current.client_id <> v_actor THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.appointments
  SET
    status = 'cancelled',
    cancelled_at = timezone('utc'::text, now()),
    cancelled_by = v_actor,
    cancelled_reason = NULLIF(trim(p_reason), ''),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_start_time timestamptz
)
RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor uuid;
  v_is_admin boolean;
  v_current public.appointments%ROWTYPE;
  v_service public.services%ROWTYPE;
  v_new_end_time timestamptz;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := auth.uid();
  v_is_admin := public.jwt_is_admin();

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_current
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF v_current.start_time <= timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Past appointments cannot be updated';
  END IF;

  IF NOT v_is_admin AND v_current.client_id <> v_actor THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_service
  FROM public.services
  WHERE id = v_current.service_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  v_new_end_time := p_new_start_time + make_interval(mins => v_service.duration_minutes);

  UPDATE public.appointments
  SET
    start_time = p_new_start_time,
    end_time = v_new_end_time,
    status = CASE WHEN v_is_admin THEN status ELSE 'pending' END,
    confirmed_at = CASE WHEN v_is_admin THEN confirmed_at ELSE NULL END,
    confirmed_by = CASE WHEN v_is_admin THEN confirmed_by ELSE NULL END,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Selected slot is already booked';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_confirm_appointment(
  p_appointment_id uuid
)
RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor uuid;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := auth.uid();

  IF v_actor IS NULL OR NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  UPDATE public.appointments
  SET
    status = 'confirmed',
    confirmed_at = timezone('utc'::text, now()),
    confirmed_by = v_actor,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_appointment_id
    AND start_time > timezone('utc'::text, now())
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or not eligible for confirmation';
  END IF;

  RETURN v_updated;
END;
$$;

COMMIT;
