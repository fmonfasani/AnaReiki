-- Migration 055: Subscription plans redesign — 6 separate plans
-- Prana Monthly/Yearly, Shakti Monthly/Yearly, Ananda Monthly/Yearly

-- 1. Add interval_type column
DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN interval_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill from slug
UPDATE pricing_plans SET interval_type = 'monthly' WHERE slug LIKE '%monthly%';
UPDATE pricing_plans SET interval_type = 'yearly' WHERE slug LIKE '%yearly%';

-- 2. Clean up old mixed plans (keep only what we need)
-- First, move subscription_promotions away from old plan_ids
UPDATE subscription_promotions SET plan_id = (
  SELECT id FROM pricing_plans WHERE slug = 'ananda-monthly' LIMIT 1
) WHERE plan_id IN (
  SELECT id FROM pricing_plans WHERE slug IN ('prana', 'shakti-monthly', 'shakti-yearly', 'ananda-yearly')
);

-- Delete old plans
DELETE FROM pricing_plans WHERE slug IN ('prana', 'shakti-monthly', 'shakti-yearly', 'ananda-monthly', 'ananda-yearly');

-- 3. Insert 6 clean plans
-- All features list
-- home, Inicio, Suscripciones, Mis Cursos, Mi Agenda, Comunidad, Mensajes,
-- Biblioteca, Clases, Podcast, Chat Buda, Evolución, Mi Perfil

INSERT INTO pricing_plans (id, name, slug, tier_slug, interval_type, price_cents, description, features, included_services, badge_text, sort_order, is_active, created_at)
VALUES
  -- Prana Free
  (gen_random_uuid(), 'Prana', 'prana-free', 'prana', 'monthly', 0, 'Plan gratuito',
   '["Inicio", "Suscripciones", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil"]'::jsonb,
   '[]'::jsonb, NULL, 1, true, now()),

  (gen_random_uuid(), 'Prana Anual', 'prana-yearly', 'prana', 'yearly', 0, 'Plan gratuito — acceso anual',
   '["Inicio", "Suscripciones", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil"]'::jsonb,
   '[]'::jsonb, NULL, 2, true, now()),

  -- Shakti $14.900/mes
  (gen_random_uuid(), 'Shakti', 'shakti-monthly', 'shakti', 'monthly', 14900, 'Acceso a biblioteca y evolución',
   '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Evolución"]'::jsonb,
   '["reiki", "meditacion"]'::jsonb, NULL, 3, true, now()),

  (gen_random_uuid(), 'Shakti Anual', 'shakti-yearly', 'shakti', 'yearly', 149000, 'Acceso a biblioteca y evolución — ahorrá 2 meses',
   '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Evolución"]'::jsonb,
   '["reiki", "meditacion"]'::jsonb, 'Ahorrá 2 meses', 4, true, now()),

  -- Ananda $29.900/mes
  (gen_random_uuid(), 'Ananda', 'ananda-monthly', 'ananda', 'monthly', 29900, 'Todo incluido, sin límites',
   '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Clases", "Podcast", "Chat Buda", "Evolución"]'::jsonb,
   '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb, 'Más popular', 5, true, now()),

  (gen_random_uuid(), 'Ananda Anual', 'ananda-yearly', 'ananda', 'yearly', 299000, 'Todo incluido — mejor valor',
   '["Inicio", "Suscripciones", "Mis Cursos", "Mi Agenda", "Comunidad", "Mensajes", "Mi Perfil", "Biblioteca", "Clases", "Podcast", "Chat Buda", "Evolución"]'::jsonb,
   '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb, 'Mejor valor', 6, true, now());

-- 4. Re-attach promo to ananda-monthly
UPDATE subscription_promotions SET plan_id = (
  SELECT id FROM pricing_plans WHERE slug = 'ananda-monthly' LIMIT 1
)
WHERE title = 'Lanzamiento Ananda';

-- 5. Add index on interval_type
CREATE INDEX IF NOT EXISTS idx_plans_interval ON pricing_plans(interval_type);

-- 6. Verify
DO $$ BEGIN
  RAISE NOTICE 'Plans count: %', (SELECT count(*) FROM pricing_plans);
  RAISE NOTICE 'Promos count: %', (SELECT count(*) FROM subscription_promotions);
END $$;
