BEGIN;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_reason text;

COMMIT;
