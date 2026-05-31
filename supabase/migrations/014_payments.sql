-- =====================================================
-- MIGRATION 014: Payments & Subscriptions (FASE 6)
-- Mercado Pago integration
-- =====================================================

BEGIN;

-- =============================================
-- 1. PRICING PLANS
-- =============================================
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_cents integer NOT NULL CHECK (price_cents > 0),
  currency text NOT NULL DEFAULT 'ARS',
  interval text NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  trial_days integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.pricing_plans (name, slug, description, price_cents, currency, interval, trial_days, sort_order) VALUES
  ('Premium Mensual', 'premium-monthly', 'Acceso completo a todo el contenido premium por un mes', 15000, 'ARS', 'month', 3, 1),
  ('Premium Anual', 'premium-yearly', 'Acceso completo con 2 meses de descuento', 120000, 'ARS', 'year', 7, 2)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY pricing_plans_select
ON public.pricing_plans FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY pricing_plans_admin_all
ON public.pricing_plans FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- =============================================
-- 2. SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')),
  mp_preapproval_id text,
  current_period_start timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  current_period_end timestamptz NOT NULL,
  trial_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions (status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_owner
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id OR public.jwt_is_admin());

CREATE POLICY subscriptions_insert
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY subscriptions_update_admin
ON public.subscriptions FOR UPDATE
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- =============================================
-- 3. PAYMENTS (transaction log)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.pricing_plans(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'ARS',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  mp_payment_id text,
  mp_preference_id text,
  payment_method text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX payments_user_idx ON public.payments (user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select_owner
ON public.payments FOR SELECT
USING (auth.uid() = user_id OR public.jwt_is_admin());

CREATE POLICY payments_insert
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY payments_update_admin
ON public.payments FOR UPDATE
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- =============================================
-- 4. FUNCTION: handle_payment_success
-- Called by webhook when payment is approved
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_payment_success(
  p_user_id uuid,
  p_plan_id uuid,
  p_amount_cents integer,
  p_mp_payment_id text,
  p_mp_preference_id text,
  p_payment_method text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.pricing_plans%ROWTYPE;
  v_subscription_id uuid;
  v_period_end timestamptz;
  v_trial_end timestamptz;
BEGIN
  SELECT * INTO v_plan FROM public.pricing_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  v_period_end := timezone('utc'::text, now()) + make_interval(months => 1);
  v_trial_end := timezone('utc'::text, now()) + make_interval(days => v_plan.trial_days);

  -- Upsert subscription
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, trial_end)
  VALUES (p_user_id, p_plan_id, 'active', timezone('utc'::text, now()), v_period_end, CASE WHEN v_plan.trial_days > 0 THEN v_trial_end ELSE NULL END)
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    plan_id = p_plan_id,
    current_period_end = v_period_end,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO v_subscription_id;

  -- Insert payment record
  INSERT INTO public.payments (user_id, subscription_id, plan_id, amount_cents, status, mp_payment_id, mp_preference_id, payment_method, paid_at)
  VALUES (p_user_id, v_subscription_id, p_plan_id, p_amount_cents, 'approved', p_mp_payment_id, p_mp_preference_id, p_payment_method, timezone('utc'::text, now()));

  -- Update user profile
  UPDATE public.profiles SET is_premium = true, updated_at = timezone('utc'::text, now()) WHERE id = p_user_id;
END;
$$;

-- =============================================
-- 5. FUNCTION: cancel_subscription
-- =============================================
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_subscription_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  UPDATE public.subscriptions
  SET status = 'canceled', cancel_at_period_end = true, updated_at = timezone('utc'::text, now())
  WHERE id = p_subscription_id;

  UPDATE public.profiles SET is_premium = false, updated_at = timezone('utc'::text, now()) WHERE id = v_user_id;
END;
$$;

-- =============================================
-- 6. FUNCTION: get_user_subscription_status
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'is_premium', p.is_premium,
    'has_subscription', CASE WHEN s.id IS NOT NULL THEN true ELSE false END,
    'subscription_status', s.status,
    'plan_name', pl.name,
    'plan_slug', pl.slug,
    'current_period_end', s.current_period_end,
    'cancel_at_period_end', s.cancel_at_period_end
  ) INTO v_result
  FROM public.profiles p
  LEFT JOIN public.subscriptions s ON s.user_id = p.id AND s.status = 'active'
  LEFT JOIN public.pricing_plans pl ON pl.id = s.plan_id
  WHERE p.id = p_user_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

COMMIT;
