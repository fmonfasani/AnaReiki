-- Migration 049: Create appointment_audit_log if missing
-- The cancel_appointment() RPC inserts into this table but it was never created in prod.

BEGIN;

CREATE TABLE IF NOT EXISTS public.appointment_audit_log (
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

CREATE INDEX IF NOT EXISTS appointment_audit_log_appt_idx
  ON public.appointment_audit_log (appointment_id, created_at DESC);

ALTER TABLE public.appointment_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS appointment_audit_log_admin_read ON public.appointment_audit_log;
CREATE POLICY appointment_audit_log_admin_read
  ON public.appointment_audit_log
  FOR SELECT
  USING (public.is_admin_user());

DROP POLICY IF EXISTS appointment_audit_log_insert_service ON public.appointment_audit_log;
CREATE POLICY appointment_audit_log_insert_service
  ON public.appointment_audit_log
  FOR INSERT
  WITH CHECK (true);

COMMIT;
