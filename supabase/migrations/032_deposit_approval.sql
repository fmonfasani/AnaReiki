-- =====================================================
-- MIGRATION 032: Deposits / Approval Flow
-- =====================================================
BEGIN;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS deposit_percentage integer NOT NULL DEFAULT 0
  CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS deposit_cents integer DEFAULT 0;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS balance_cents integer DEFAULT 0;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'n/a'
  CHECK (approval_status IN ('n/a', 'pending_approval', 'approved', 'rejected'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS rejection_action text DEFAULT NULL
  CHECK (rejection_action IS NULL OR rejection_action IN ('reschedule', 'refund'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS refund_processed boolean DEFAULT false;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cutoff_at timestamptz;

COMMIT;
