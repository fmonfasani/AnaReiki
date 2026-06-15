-- Migration 052: Allow mp_payment_id nullable for offline payments
-- + Add payment_type 'offline_balance'

BEGIN;

ALTER TABLE public.mp_payment_logs
  ALTER COLUMN mp_payment_id DROP NOT NULL;

-- Also add a 'concept' text field to clarify what the payment is for
ALTER TABLE public.mp_payment_logs
  ADD COLUMN IF NOT EXISTS concept text DEFAULT NULL;

COMMIT;
