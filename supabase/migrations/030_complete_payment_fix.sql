-- Migration 030: Complete Payment Flow Fix
-- ============================================
-- Incluye: service pricing, cancel_appointment overload fix,
-- pending_payment enum, y confirm-payment function.
-- Compatible con migraciones 027+028+029.
-- Todas las operaciones son idempotentes (IF NOT EXISTS / IF EXISTS).

BEGIN;

-- ============================================================
-- PARTE 1: Service Pricing (de migration 027)
-- ============================================================

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'pending_payment', 'paid', 'refunded'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS mp_preference_id text;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS mp_payment_id text;

-- Precios default sugeridos (owner los ajusta después)
UPDATE public.services SET price_cents = 5000 WHERE price_cents = 0 AND slug IN ('consulta-inicial', 'sesion-reiki');
UPDATE public.services SET price_cents = 3000 WHERE price_cents = 0 AND slug IN ('sesion-yoga', 'meditacion-guiada');

-- ============================================================
-- PARTE 2: Fix cancel_appointment overload (de migration 028)
-- ============================================================

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

-- ============================================================
-- PARTE 3: Add pending_payment to appointment_status enum (de migration 029)
-- ============================================================

ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'pending_payment';

-- ============================================================
-- PARTE 4: confirm_payment function (necesaria para webhooks)
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirm_appointment_payment(
  p_appointment_id uuid,
  p_mp_payment_id text DEFAULT NULL,
  p_mp_preference_id text DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated public.appointments%ROWTYPE;
BEGIN
  UPDATE public.appointments
  SET status = 'confirmed',
      payment_status = 'paid',
      mp_payment_id = COALESCE(p_mp_payment_id, mp_payment_id),
      mp_preference_id = COALESCE(p_mp_preference_id, mp_preference_id),
      updated_at = now()
  WHERE id = p_appointment_id
    AND payment_status = 'pending_payment'
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or not in pending_payment status';
  END IF;

  RETURN v_updated;
END;
$$;

COMMIT;
