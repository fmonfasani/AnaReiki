-- Migration 055b: Subscription plans redesign — 6 plans (UPDATE in-place, no DELETE)
-- Prana Monthly/Yearly, Shakti Monthly/Yearly, Ananda Monthly/Yearly

-- 1. Add interval_type column
DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN interval_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Backfill interval_type from existing slug
UPDATE pricing_plans SET interval_type = 'monthly' WHERE slug LIKE '%monthly%';
UPDATE pricing_plans SET interval_type = 'yearly' WHERE slug LIKE '%yearly%';

-- 3. Move subscription_promotions to ananda-monthly (the only one we keep as-is)
UPDATE subscription_promotions SET plan_id = (
  SELECT id FROM pricing_plans WHERE slug = 'ananda-monthly' LIMIT 1
)
WHERE plan_id != (SELECT id FROM pricing_plans WHERE slug = 'ananda-monthly' LIMIT 1)
AND EXISTS (SELECT 1 FROM pricing_plans WHERE slug = 'ananda-monthly');

-- 4. Also move subscriptions to ananda-monthly if they reference deleted plans
-- (so FKs don't break)
DO $$ BEGIN
  UPDATE subscriptions SET plan_id = (
    SELECT id FROM pricing_plans WHERE slug = 'ananda-monthly' LIMIT 1
  )
  WHERE plan_id IN (
    SELECT id FROM pricing_plans WHERE slug IN ('prana', 'shakti-monthly', 'shakti-yearly', 'ananda-yearly')
  )
  AND EXISTS (SELECT 1 FROM pricing_plans WHERE slug = 'ananda-monthly');
EXCEPTION WHEN others THEN NULL;
END $$;

-- 5. Update existing plans in-place (preserves FKs)
-- Prana (keep as monthly, slug='prana' stays)
UPDATE pricing_plans SET
  name = 'Prana',
  tier_slug = 'prana',
  interval_type = 'monthly',
  price_cents = 0,
  description = 'Plan gratuito',
  features = '["Inicio", "Suscripciones", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil"]'::jsonb,
  included_services = '[]'::jsonb,
  badge_text = NULL,
  sort_order = 1,
  is_active = true
WHERE slug = 'prana';

-- Shakti Mensual (slug='shakti-monthly')
UPDATE pricing_plans SET
  name = 'Shakti',
  tier_slug = 'shakti',
  interval_type = 'monthly',
  price_cents = 14900,
  description = 'Acceso a biblioteca y evolución',
  features = '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Evolución"]'::jsonb,
  included_services = '["reiki", "meditacion"]'::jsonb,
  badge_text = NULL,
  sort_order = 3,
  is_active = true
WHERE slug = 'shakti-monthly';

-- Shakti Anual (slug='shakti-yearly')
UPDATE pricing_plans SET
  name = 'Shakti Anual',
  tier_slug = 'shakti',
  interval_type = 'yearly',
  price_cents = 149000,
  description = 'Acceso a biblioteca y evolución — ahorrá 2 meses',
  features = '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Evolución"]'::jsonb,
  included_services = '["reiki", "meditacion"]'::jsonb,
  badge_text = 'Ahorrá 2 meses',
  sort_order = 4,
  is_active = true
WHERE slug = 'shakti-yearly';

-- Ananda Mensual (slug='ananda-monthly')
UPDATE pricing_plans SET
  name = 'Ananda',
  tier_slug = 'ananda',
  interval_type = 'monthly',
  price_cents = 29900,
  description = 'Todo incluido, sin límites',
  features = '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Clases", "Podcast", "Chat Buda", "Evolución"]'::jsonb,
  included_services = '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb,
  badge_text = 'Más popular',
  sort_order = 5,
  is_active = true
WHERE slug = 'ananda-monthly';

-- Ananda Anual (slug='ananda-yearly')
UPDATE pricing_plans SET
  name = 'Ananda Anual',
  tier_slug = 'ananda',
  interval_type = 'yearly',
  price_cents = 299000,
  description = 'Todo incluido — mejor valor',
  features = '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Clases", "Podcast", "Chat Buda", "Evolución"]'::jsonb,
  included_services = '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb,
  badge_text = 'Mejor valor',
  sort_order = 6,
  is_active = true
WHERE slug = 'ananda-yearly';

-- 6. Insert Prana Anual (new plan, no FKs to worry about)
INSERT INTO pricing_plans (id, name, slug, tier_slug, interval_type, price_cents, description, features, included_services, badge_text, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Prana Anual', 'prana-yearly', 'prana', 'yearly', 0, 'Plan gratuito — acceso anual',
  '["Inicio", "Suscripciones", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil"]'::jsonb,
  '[]'::jsonb, NULL, 2, true, now()
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE slug = 'prana-yearly');

-- 7. Add index on interval_type
CREATE INDEX IF NOT EXISTS idx_plans_interval ON pricing_plans(interval_type);

-- 8. Verify
DO $$ BEGIN
  RAISE NOTICE 'Plans: %', (SELECT count(*) FROM pricing_plans);
  RAISE NOTICE 'Plan slugs: %', (SELECT string_agg(slug || '(' || interval_type || ')', ', ') FROM pricing_plans);
END $$;
