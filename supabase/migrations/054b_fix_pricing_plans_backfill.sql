-- Migration 054b: Fix pricing_plans backfill
-- Existing plans use 'slug' not 'tier_slug', and have different naming

-- Add tier_slug column if missing
DO $$ BEGIN
  ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS tier_slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Backfill by slug pattern
UPDATE pricing_plans SET
  tier_slug = 'prana',
  annual_price_cents = 0,
  monthly_equiv_cents = 0,
  features = '["Perfil personalizado", "Agenda y reservas", "Comunidad", "Mensajes directos", "Notificaciones"]'::jsonb,
  included_services = '[]'::jsonb,
  badge_text = NULL,
  sort_order = 1
WHERE slug = 'prana' OR slug ILIKE '%prana%';

UPDATE pricing_plans SET
  tier_slug = 'shakti',
  annual_price_cents = CASE WHEN slug LIKE '%yearly%' THEN price_cents ELSE 14900 * 12 END,
  monthly_equiv_cents = 14900,
  features = '["Todo lo de Prana", "Biblioteca premium", "Evolución y mood tracker", "Podcast exclusivo", "Contenido premium"]'::jsonb,
  included_services = '["reiki", "meditacion"]'::jsonb,
  badge_text = NULL,
  sort_order = 2
WHERE slug ILIKE '%shakti%';

UPDATE pricing_plans SET
  tier_slug = 'ananda',
  annual_price_cents = CASE WHEN slug LIKE '%yearly%' THEN price_cents ELSE 29900 * 12 END,
  monthly_equiv_cents = 29900,
  features = '["Todo lo de Shakti", "Clases grabadas", "Chat Buda (IA)", "Evolución completa + insights IA", "Acceso anticipado"]'::jsonb,
  included_services = '["reiki", "meditacion", "yoga", "clases_grabadas"]'::jsonb,
  badge_text = CASE WHEN slug LIKE '%yearly%' THEN 'Mejor valor' ELSE NULL END,
  sort_order = CASE WHEN slug LIKE '%yearly%' THEN 4 ELSE 3 END
WHERE slug ILIKE '%ananda%';

-- Ensure is_active is set
UPDATE pricing_plans SET is_active = true WHERE is_active IS NULL;
