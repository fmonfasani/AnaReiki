BEGIN;

-- =============================================
-- MIGRATION 026: Fix plan_tier in payment functions
-- 
-- Problema: handle_payment_success() y cancel_subscription()
-- nunca actualizan plan_tier, solo is_premium.
-- El layout consultante lee plan_tier, no is_premium.
-- =============================================

-- 1. Renombrar planes viejos "premium" a "shakti"
UPDATE public.pricing_plans
SET slug = REPLACE(slug, 'premium', 'shakti'),
    name = 'Shakti',
    updated_at = timezone('utc'::text, now())
WHERE slug LIKE 'premium%';

-- 2. Fix handle_payment_success: también setear plan_tier
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
  v_tier text;
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

  -- Extraer tier del slug (ej: 'shakti-monthly' → 'shakti', 'prana' → 'prana')
  v_tier := split_part(v_plan.slug, '-', 1);
  IF v_tier NOT IN ('prana', 'shakti', 'ananda') THEN
    v_tier := 'prana';
  END IF;

  -- Update user profile: both is_premium AND plan_tier
  UPDATE public.profiles
  SET is_premium = (v_tier != 'prana'),
      plan_tier = v_tier,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id;
END;
$$;

-- 3. Fix cancel_subscription: reset plan_tier a 'prana'
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

  UPDATE public.profiles
  SET is_premium = false,
      plan_tier = 'prana',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_user_id;
END;
$$;

COMMIT;
