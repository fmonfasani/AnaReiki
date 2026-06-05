-- Fix fmonfasanisap: reset plan_tier to prana
UPDATE public.profiles
SET plan_tier = 'prana',
    is_premium = false,
    updated_at = timezone('utc'::text, now())
WHERE email LIKE '%sap%'
   OR email LIKE '%fmonfasanisap%';

-- Show what was changed
SELECT id, email, plan_tier, is_premium
FROM public.profiles
WHERE email LIKE '%sap%'
   OR email LIKE '%fmonfasanisap%';
