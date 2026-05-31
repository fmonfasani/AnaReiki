-- =====================================================
-- MIGRATION 016: Tiered subscription plans
-- Description: Adds plan_tier column to profiles,
--              updates interval constraint for 'free',
--              and inserts PRANA plan
-- =====================================================

-- 1. Add plan_tier column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'prana' CHECK (plan_tier IN ('prana', 'shakti', 'ananda'));

-- 2. Allow 'free' interval and 0 price_cents in pricing_plans
ALTER TABLE public.pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_interval_check;
ALTER TABLE public.pricing_plans ADD CONSTRAINT pricing_plans_interval_check CHECK (interval IN ('free', 'month', 'year'));
ALTER TABLE public.pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_price_cents_check;
ALTER TABLE public.pricing_plans ADD CONSTRAINT pricing_plans_price_cents_check CHECK (price_cents >= 0);

-- 3. Insert PRANA plan (if not exists)
INSERT INTO public.pricing_plans (name, slug, description, price_cents, currency, interval, trial_days, is_active, sort_order)
SELECT 'Prana', 'prana', 'Energía vital — agendá tus citas con Ana', 0, 'ARS', 'free', 0, true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'prana');

-- 4. Update existing premium users to ananda
UPDATE public.profiles SET plan_tier = 'ananda' WHERE is_premium = true;
