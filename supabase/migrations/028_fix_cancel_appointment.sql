-- Migration 028: Fix cancel_appointment overload conflict
-- ========================================================
-- Problema: existían dos funciones cancel_appointment:
--   1. (p_appointment_id uuid, p_reason text DEFAULT NULL)       RETURNS appointments  (006)
--   2. (p_appointment_id uuid, p_reason text DEFAULT NULL, p_cancelled_by uuid DEFAULT NULL) RETURNS void (019)
-- El RPC con 2 parámetros era ambiguo.
-- Solución: dropear la vieja (1) y reemplazar (2) con RETURNS appointments.

DROP FUNCTION IF EXISTS public.cancel_appointment(uuid, text);
DROP FUNCTION IF EXISTS public.cancel_appointment(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.cancel_appointment(
  p_appointment_id uuid,
  p_reason text DEFAULT NULL,
  p_cancelled_by uuid DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id uuid;
  v_slot_id uuid;
  v_old_status appointment_status;
  v_updated public.appointments%ROWTYPE;
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
      cancelled_by = p_cancelled_by,
      updated_at = now()
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  -- Liberar cupo del slot (si aplica)
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

  RETURN v_updated;
END;
$$;
