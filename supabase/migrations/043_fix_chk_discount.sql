-- ============================================================
-- MIGRATION 043: Fix chk_discount constraint
-- El constraint original solo aceptaba discount_percent,
-- discount_fixed o price_override (schema anterior). Ahora
-- tambien acepta discount_factor (schema nuevo).
-- ============================================================

BEGIN;

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS chk_discount;

ALTER TABLE public.promotions ADD CONSTRAINT chk_discount CHECK (
  discount_percent IS NOT NULL OR
  discount_fixed IS NOT NULL OR
  price_override IS NOT NULL OR
  discount_factor IS NOT NULL
);

COMMIT;
