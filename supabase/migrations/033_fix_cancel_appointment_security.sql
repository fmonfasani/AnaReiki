-- ============================================================
-- MIGRATION 033: Fix cancel_appointment SECURITY DEFINER
-- ============================================================
-- Problema: cancel_appointment() no tenía SECURITY DEFINER.
-- Al llamarse via supabase.rpc() con el cliente anónimo,
-- las queries internas quedaban sujetas a RLS. Si RLS
-- bloqueaba el SELECT, la función devolvía "Turno no encontrado".
--
-- Solución: SECURITY DEFINER + verificación explícita de
-- ownership/admin dentro de la función.
-- ============================================================

BEGIN;

DROP FUNCTION IF EXISTS public.cancel_appointment(uuid, text);
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
  v_slot_id uuid;
  v_old_status appointment_status;
  v_updated public.appointments%ROWTYPE;
BEGIN
  v_actor := COALESCE(p_cancelled_by, auth.uid());

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_is_admin := public.jwt_is_admin();

  SELECT client_id, slot_id, status INTO v_client_id, v_slot_id, v_old_status
  FROM public.appointments WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;

  IF v_client_id <> v_actor AND NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.appointments
  SET status = 'cancelled',
      cancelled_reason = p_reason,
      cancelled_at = now(),
      cancelled_by = v_actor,
      updated_at = now()
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  IF v_slot_id IS NOT NULL THEN
    UPDATE public.availability_slots
    SET booked_count = GREATEST(booked_count - 1, 0)
    WHERE id = v_slot_id;
  END IF;

  INSERT INTO public.appointment_audit_log
    (appointment_id, actor_user_id, action, from_status, to_status, metadata)
  VALUES
    (p_appointment_id, v_actor, 'cancelled', v_old_status, 'cancelled',
     jsonb_build_object('reason', p_reason));

  RETURN v_updated;
END;
$$;

COMMIT;
