-- Migration 050: mp_payment_logs — store full MP payment data
-- Captures all relevant fields from Mercado Pago for audit and dashboard.

BEGIN;

CREATE TABLE IF NOT EXISTS public.mp_payment_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mp_payment_id bigint NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_type text NOT NULL DEFAULT 'session',
    -- 'session' = individual promo/service, 'subscription' = Shakti/Ananda, 'promo_bundle' = buy promo pack

  -- Core fields
  status text NOT NULL,
  status_detail text,
  transaction_amount numeric(10,2),
  currency_id text DEFAULT 'ARS',
  external_reference jsonb,

  -- Dates from MP
  mp_date_created timestamptz,
  mp_date_approved timestamptz,

  -- Payment method
  payment_method_id text,
  payment_type_id text,
  installments integer DEFAULT 1,
  statement_descriptor text,

  -- Payer
  payer_email text,
  payer_id bigint,
  payer_identification_type text,
  payer_identification_number text,
  payer_type text,

  -- Financials
  net_received_amount numeric(10,2),
  total_paid_amount numeric(10,2),
  fee_details jsonb,
  transaction_amount_refunded numeric(10,2) DEFAULT 0,

  -- Card info (masked)
  card_last_digits text,
  cardholder_name text,

  -- Raw payload (full MP response for debugging)
  raw_response jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mp_payment_logs_appointment ON public.mp_payment_logs (appointment_id);
CREATE INDEX IF NOT EXISTS idx_mp_payment_logs_user ON public.mp_payment_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_mp_payment_logs_mp_id ON public.mp_payment_logs (mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_mp_payment_logs_type ON public.mp_payment_logs (payment_type);
CREATE INDEX IF NOT EXISTS idx_mp_payment_logs_status ON public.mp_payment_logs (status);

ALTER TABLE public.mp_payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mp_payment_logs_admin_all ON public.mp_payment_logs;
CREATE POLICY mp_payment_logs_admin_all
  ON public.mp_payment_logs
  USING (public.is_admin_user());

DROP POLICY IF EXISTS mp_payment_logs_user_select ON public.mp_payment_logs;
CREATE POLICY mp_payment_logs_user_select
  ON public.mp_payment_logs
  FOR SELECT
  USING (auth.uid() = user_id);

COMMIT;
