-- =====================================================
-- MIGRATION: 008 Administrative Appointment Control
-- Description: Grants full control over appointment states to admins
--              and robust verification for admin actions.
-- =====================================================

BEGIN;

-- 1. DROP OLD RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_client" ON public.appointments;

-- 2. NEW ADMIN ACTION POLICY: Admins can do ANYTHING with any appointment
CREATE POLICY "appointments_admin_full_management" ON public.appointments
FOR ALL
USING ( public.jwt_is_admin() )
WITH CHECK ( public.jwt_is_admin() );

-- 3. UPDATED CLIENT POLICY: Only owners can cancel their own upcoming appointments
CREATE POLICY "appointments_client_self_management" ON public.appointments
FOR UPDATE
USING ( (SELECT auth.uid()) = client_id )
WITH CHECK (
  (SELECT auth.uid()) = client_id AND (
    -- Only allow cancelling
    status = 'cancelled' AND (
      -- Ensure critical fields are NOT changed by client
      service_id = (SELECT service_id FROM public.appointments WHERE id = id) AND
      consultant_id = (SELECT consultant_id FROM public.appointments WHERE id = id) AND
      start_time = (SELECT start_time FROM public.appointments WHERE id = id)
    )
  )
);

-- 4. FUNCTION: Comprehensive Admin Appointment Update
-- This single function replaces multiple RPCs, allowing Ana to manage all fields.
CREATE OR REPLACE FUNCTION public.admin_manage_appointment(
  p_appointment_id uuid,
  p_status public.appointment_status DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_new_start_time timestamptz DEFAULT NULL
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor uuid;
  v_updated public.appointments%ROWTYPE;
  v_service public.services%ROWTYPE;
  v_current_service_id uuid;
BEGIN
  v_actor := auth.uid();
  
  -- Security check
  IF v_actor IS NULL OR NOT public.jwt_is_admin() THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  -- Get current service for duration if rescheduling
  SELECT service_id INTO v_current_service_id FROM public.appointments WHERE id = p_appointment_id;
  SELECT * INTO v_service FROM public.services WHERE id = v_current_service_id;

  UPDATE public.appointments
  SET
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    start_time = COALESCE(p_new_start_time, start_time),
    end_time = CASE 
      WHEN p_new_start_time IS NOT NULL THEN p_new_start_time + make_interval(mins => v_service.duration_minutes)
      ELSE end_time 
    END,
    confirmed_at = CASE WHEN p_status = 'confirmed' THEN timezone('utc'::text, now()) ELSE confirmed_at END,
    confirmed_by = CASE WHEN p_status = 'confirmed' THEN v_actor ELSE confirmed_by END,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_appointment_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  RETURN v_updated;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Collision detected: The selected time slot is occupied.';
END;
$$;

COMMIT;
