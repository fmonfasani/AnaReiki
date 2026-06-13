-- ============================================================
-- MIGRATION 046: Visible flag for services and promotions
-- Controla si aparece en el selector de reserva del consultante.
-- Independiente de is_active (estado operativo).
-- ============================================================

BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- Los existentes quedan visibles
UPDATE services SET is_visible = true WHERE is_visible IS NULL;
UPDATE promotions SET is_visible = true WHERE is_visible IS NULL;

COMMIT;
