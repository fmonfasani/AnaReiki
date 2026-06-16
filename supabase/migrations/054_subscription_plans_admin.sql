-- Migration 054: Subscription plans management
-- Extend pricing_plans + create subscription_promotions

-- 1. Add new columns to pricing_plans
DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS annual_price_cents INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS monthly_equiv_cents INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS included_services JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS badge_text TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS tier_slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Backfill existing plans
UPDATE pricing_plans SET
  tier_slug = 'prana',
  annual_price_cents = 0,
  monthly_equiv_cents = 0,
  features = '["Perfil personalizado", "Agenda y reservas", "Comunidad", "Mensajes directos", "Notificaciones"]'::jsonb,
  included_services = '[]'::jsonb,
  badge_text = NULL,
  sort_order = 0,
  is_active = true
WHERE name ILIKE '%prana%' OR name = 'Prana';

UPDATE pricing_plans SET
  tier_slug = 'shakti',
  annual_price_cents = 14900 * 12,
  monthly_equiv_cents = 14900,
  features = '["Todo lo de Prana", "Biblioteca premium", "Evolución y mood tracker", "Podcast exclusivo", "Contenido premium"]'::jsonb,
  included_services = '["reiki", "meditacion"]'::jsonb,
  badge_text = NULL,
  sort_order = 1,
  is_active = true
WHERE name ILIKE '%shakti%' OR name = 'Shakti';

UPDATE pricing_plans SET
  tier_slug = 'ananda',
  annual_price_cents = 29900 * 12,
  monthly_equiv_cents = 29900,
  features = '["Todo lo de Shakti", "Clases grabadas", "Chat Buda (IA)", "Evolución completa + insights IA", "Acceso anticipado"]'::jsonb,
  included_services = '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb,
  badge_text = 'Más popular',
  sort_order = 2,
  is_active = true
WHERE name ILIKE '%ananda%' OR name = 'Ananda';

-- Insert plans if they don't exist
INSERT INTO pricing_plans (id, name, tier_slug, price_cents, annual_price_cents, monthly_equiv_cents, features, included_services, badge_text, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Prana', 'prana', 0, 0, 0,
  '["Perfil personalizado", "Agenda y reservas", "Comunidad", "Mensajes directos", "Notificaciones"]'::jsonb,
  '[]'::jsonb, NULL, 0, true, now()
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE tier_slug = 'prana');

INSERT INTO pricing_plans (id, name, tier_slug, price_cents, annual_price_cents, monthly_equiv_cents, features, included_services, badge_text, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Shakti', 'shakti', 14900, 178800, 14900,
  '["Todo lo de Prana", "Biblioteca premium", "Evolución y mood tracker", "Podcast exclusivo", "Contenido premium"]'::jsonb,
  '["reiki", "meditacion"]'::jsonb, NULL, 1, true, now()
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE tier_slug = 'shakti');

INSERT INTO pricing_plans (id, name, tier_slug, price_cents, annual_price_cents, monthly_equiv_cents, features, included_services, badge_text, sort_order, is_active, created_at)
SELECT gen_random_uuid(), 'Ananda', 'ananda', 29900, 358800, 29900,
  '["Todo lo de Shakti", "Clases grabadas", "Chat Buda (IA)", "Evolución completa + insights IA", "Acceso anticipado"]'::jsonb,
  '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb, 'Más popular', 2, true, now()
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE tier_slug = 'ananda');

-- 3. Create subscription_promotions
CREATE TABLE IF NOT EXISTS subscription_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  promo_code TEXT,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS for subscription_promotions
ALTER TABLE subscription_promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "promos_select" ON subscription_promotions;
  CREATE POLICY "promos_select" ON subscription_promotions FOR SELECT USING (
    is_active = true OR is_admin_user()
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "promos_admin" ON subscription_promotions;
  CREATE POLICY "promos_admin" ON subscription_promotions FOR ALL USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_plans_tier ON pricing_plans(tier_slug);
CREATE INDEX IF NOT EXISTS idx_sub_promos_plan ON subscription_promotions(plan_id);
CREATE INDEX IF NOT EXISTS idx_sub_promos_active ON subscription_promotions(is_active, valid_from, valid_until);

-- 6. Seed first promo
INSERT INTO subscription_promotions (plan_id, title, description, discount_percent, valid_until, is_active)
SELECT id, 'Lanzamiento Ananda', '20% off en tu primer año de Ananda', 20, now() + INTERVAL '30 days', true
FROM pricing_plans WHERE tier_slug = 'ananda'
AND NOT EXISTS (SELECT 1 FROM subscription_promotions WHERE title = 'Lanzamiento Ananda');
