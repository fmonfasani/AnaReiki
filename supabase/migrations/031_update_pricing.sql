BEGIN;

-- Actualizar precio Shakti mensual a $14.900 ARS/mes
UPDATE public.pricing_plans
SET price_cents = 14900,
    description = 'Acceso a biblioteca y evolución — $14.900/mes'
WHERE slug = 'shakti-monthly';

-- Insertar plan Ananda mensual ($29.900 ARS/mes)
INSERT INTO public.pricing_plans (name, slug, description, price_cents, currency, interval, trial_days, is_active, sort_order)
SELECT 'Ananda', 'ananda-monthly', 'Dicha plena — acceso completo ilimitado — $29.900/mes', 29900, 'ARS', 'month', 0, true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans WHERE slug = 'ananda-monthly');

-- Actualizar sort_order de planes existentes
UPDATE public.pricing_plans SET sort_order = 1 WHERE slug = 'prana';
UPDATE public.pricing_plans SET sort_order = 2 WHERE slug = 'shakti-monthly';
UPDATE public.pricing_plans SET sort_order = 4 WHERE slug = 'shakti-yearly';

COMMIT;
