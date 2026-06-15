-- ============================================================
-- MIGRATION 051b: Migrate data + recreate RPCs
-- ============================================================
-- Run AFTER 051a.
-- Handles case where old enum values were already dropped.
-- ============================================================

BEGIN;

-- 0. Re-agregar valores viejos si faltan (por si la 051 original los dropeó)
DO $$
BEGIN
  BEGIN ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'pending'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'pending_approval'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'approved'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'no_show'; EXCEPTION WHEN others THEN NULL; END;
END $$;

COMMIT;

-- Separar transacción para que los valores viejos estén disponibles
BEGIN;

-- 1. Migrar datos: mapear estados viejos → nuevos
UPDATE public.appointments SET status = 'pending_confirmation' WHERE status = 'pending';
UPDATE public.appointments SET status = 'pending_confirmation' WHERE status = 'pending_approval';
UPDATE public.appointments SET status = 'confirmed' WHERE status = 'approved';
UPDATE public.appointments
  SET status = 'completed',
      attendance_result = 'no_show',
      completed_at = updated_at
  WHERE status = 'no_show';

-- 2. Eliminar valores viejos del enum
DO $$
BEGIN
  BEGIN ALTER TYPE public.appointment_status DROP VALUE 'pending'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status DROP VALUE 'pending_approval'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status DROP VALUE 'approved'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE public.appointment_status DROP VALUE 'no_show'; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- 3. Actualizar cancel_appointment RPC
DROP FUNCTION IF EXISTS public.cancel_appointment(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text DEFAULT NULL,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_is_admin boolean;
  v_client_id uuid;
  v_old_status public.appointment_status;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := COALESCE(p_cancelled_by, auth.uid());

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := public.jwt_is_admin();

  SELECT client_id, status INTO v_client_id, v_old_status
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

  IF v_client_id <> v_actor AND NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF v_old_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'No se puede cancelar un turno %', v_old_status;
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_reason = p_reason,
      cancelled_at = now(),
      cancelled_by = v_actor,
      updated_at = now()
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status, metadata)
  VALUES
    (p_appointment_id, v_actor, 'cancelled', v_old_status, 'cancelled',
     jsonb_build_object('reason', p_reason));

  RETURN v_updated;
END;
$$;

-- 4. RPC: confirm appointment
CREATE OR REPLACE FUNCTION public.confirm_appointment(
  p_appointment_id uuid,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_old_status public.appointment_status;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := COALESCE(p_confirmed_by, auth.uid());

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden confirmar turnos';
  END IF;

  SELECT status INTO v_old_status
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

  IF v_old_status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'El turno no está pendiente de confirmación (actual: %)', v_old_status;
  END IF;

  UPDATE public.appointments
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status)
  VALUES
    (p_appointment_id, v_actor, 'confirmed', 'pending_confirmation', 'confirmed');

  RETURN v_updated;
END;
$$;

-- 5. RPC: complete appointment con attendance_result
CREATE OR REPLACE FUNCTION public.complete_appointment(
  p_appointment_id uuid,
  p_attendance_result public.attendance_result_type,
  p_completed_by uuid DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_old_status public.appointment_status;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := COALESCE(p_completed_by, auth.uid());

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'Solo admins pueden completar turnos';
  END IF;

  SELECT status INTO v_old_status
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

  IF v_old_status != 'confirmed' THEN
    RAISE EXCEPTION 'Solo se puede completar un turno confirmado (actual: %)', v_old_status;
  END IF;

  IF p_attendance_result IS NULL THEN
    RAISE EXCEPTION 'Debe especificar el resultado de asistencia';
  END IF;

  UPDATE public.appointments
  SET status = 'completed',
      attendance_result = p_attendance_result,
      completed_at = now(),
      completed_by = v_actor,
      updated_at = now()
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status, metadata)
  VALUES
    (p_appointment_id, v_actor, 'completed', v_old_status, 'completed',
     jsonb_build_object('attendance_result', p_attendance_result));

  RETURN v_updated;
END;
$$;

-- 6. RPC: reschedule from attendance
CREATE OR REPLACE FUNCTION public.reschedule_from_attendance(
  p_appointment_id uuid,
  p_new_start_time timestamptz,
  p_new_end_time timestamptz,
  p_rescheduled_by uuid DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_old public.appointments%ROWTYPE;
  v_new public.appointments%ROWTYPE;
BEGIN
  v_actor := COALESCE(p_rescheduled_by, auth.uid());

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_old
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

  IF v_old.status != 'confirmed' THEN
    RAISE EXCEPTION 'Solo se puede reprogramar un turno confirmado';
  END IF;

  INSERT INTO public.appointments (
    service_id, consultant_id, client_id,
    start_time, end_time, modality, notes,
    status, price_cents, deposit_cents, balance_cents,
    payment_status, promotion_id, original_appointment_id
  ) VALUES (
    v_old.service_id, v_old.consultant_id, v_old.client_id,
    p_new_start_time, p_new_end_time, v_old.modality, v_old.notes,
    'pending_payment', v_old.price_cents, v_old.deposit_cents, v_old.balance_cents,
    v_old.payment_status, v_old.promotion_id, p_appointment_id
  ) RETURNING * INTO v_new;

  UPDATE public.appointments
  SET status = 'completed',
      attendance_result = 'rescheduled',
      new_appointment_id = v_new.id,
      completed_at = now(),
      completed_by = v_actor,
      updated_at = now()
  WHERE id = p_appointment_id;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status, metadata)
  VALUES
    (p_appointment_id, v_actor, 'rescheduled', 'confirmed', 'completed',
     jsonb_build_object('new_appointment_id', v_new.id));

  RETURN v_new;
END;
$$;

-- 7. Actualizar get_agenda_stats
DROP FUNCTION IF EXISTS public.get_agenda_stats(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_agenda_stats(
  p_consultant_id uuid DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_appointments bigint,
  confirmed bigint,
  cancelled bigint,
  no_show bigint,
  completed bigint,
  pending bigint,
  pending_confirmation bigint,
  cancellation_rate numeric,
  avg_sessions_per_client numeric,
  peak_day integer,
  peak_hour integer,
  attended bigint,
  rescheduled bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT a.*
    FROM public.appointments a
    WHERE a.start_time >= (now() - (p_days || ' days')::interval)
      AND (p_consultant_id IS NULL OR a.consultant_id = p_consultant_id)
  ),
  base AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'confirmed') AS conf,
      count(*) FILTER (WHERE status = 'cancelled') AS canc,
      count(*) FILTER (WHERE status = 'completed' AND attendance_result = 'no_show') AS ns,
      count(*) FILTER (WHERE status = 'completed') AS comp,
      count(*) FILTER (WHERE status IN ('pending_payment', 'pending_confirmation')) AS pend,
      count(*) FILTER (WHERE status = 'pending_confirmation') AS pend_conf,
      count(*) FILTER (WHERE status = 'completed' AND attendance_result = 'attended') AS att,
      count(*) FILTER (WHERE status = 'completed' AND attendance_result = 'rescheduled') AS resch
    FROM recent
  ),
  clients AS (
    SELECT count(DISTINCT client_id) AS unique_clients FROM recent WHERE status = 'completed'
  ),
  days AS (
    SELECT extract(dow FROM start_time)::integer AS dow, extract(hour FROM start_time)::integer AS hr
    FROM recent WHERE status IN ('confirmed', 'completed')
  ),
  peak AS (
    SELECT dow, hr, row_number() OVER (ORDER BY count(*) DESC) AS rn
    FROM days GROUP BY dow, hr
  )
  SELECT
    b.total, b.conf, b.canc, b.ns, b.comp, b.pend, b.pend_conf,
    CASE WHEN b.total > 0 THEN round(b.canc::numeric / b.total * 100, 1) ELSE 0 END,
    CASE WHEN c.unique_clients > 0 THEN round(b.total::numeric / c.unique_clients, 1) ELSE 0 END,
    (SELECT p.dow FROM peak p WHERE p.rn = 1),
    (SELECT p.hr FROM peak p WHERE p.rn = 1),
    b.att, b.resch
  FROM base b, clients c;
END;
$$;

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_appointments_attendance ON public.appointments (attendance_result) WHERE attendance_result IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_original ON public.appointments (original_appointment_id) WHERE original_appointment_id IS NOT NULL;

COMMIT;
