-- ============================================================
-- MIGRATION 040: Promo v2 — modality, discount_factor, deposit
-- ============================================================
-- Agrega a promotions: modalidad exclusiva, factor de descuento,
-- tipo y valor de seña. Actualiza get_available_promos().
-- ============================================================

BEGIN;

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS modality TEXT CHECK (modality IN ('online', 'presencial'));

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS discount_factor DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (discount_factor >= 0 AND discount_factor <= 1);

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS deposit_type TEXT NOT NULL DEFAULT 'none' CHECK (deposit_type IN ('percent', 'fixed', 'none'));

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS deposit_value DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (deposit_value >= 0);

-- Actualizar get_available_promos para devolver los nuevos campos
DROP FUNCTION IF EXISTS public.get_available_promos(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_available_promos(
  p_service_id UUID,
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  discount_percent INTEGER,
  discount_fixed DECIMAL(10,2),
  price_override DECIMAL(10,2),
  final_price_cents INTEGER,
  original_price_cents INTEGER,
  allowed_tiers TEXT[],
  expires_at TIMESTAMPTZ,
  bundle_price_cents INTEGER,
  max_sessions INTEGER,
  modality TEXT,
  discount_factor DECIMAL(4,2),
  deposit_type TEXT,
  deposit_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_price INTEGER;
BEGIN
  SELECT price_cents INTO v_service_price FROM public.services WHERE id = p_service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.discount_percent,
    p.discount_fixed,
    p.price_override,
    CASE
      WHEN p.price_override IS NOT NULL THEN (p.price_override * 100)::INTEGER
      WHEN p.discount_percent IS NOT NULL THEN GREATEST(0, v_service_price - (v_service_price * p.discount_percent / 100))
      WHEN p.discount_fixed IS NOT NULL THEN GREATEST(0, v_service_price - (p.discount_fixed * 100)::INTEGER)
      ELSE v_service_price
    END AS final_price_cents,
    v_service_price AS original_price_cents,
    p.allowed_tiers,
    p.expires_at,
    p.bundle_price_cents,
    p.max_sessions,
    p.modality,
    p.discount_factor,
    p.deposit_type,
    p.deposit_value
  FROM public.promotions p
  WHERE p.is_active = true
    AND (p.expires_at IS NULL OR p.expires_at > timezone('utc'::text, now()))
    AND (p.max_purchases IS NULL OR p.current_purchases < p.max_purchases)
    AND (
      p.allowed_tiers IS NULL
      OR p.allowed_tiers = '{}'
      OR p_tier IS NULL
      OR p_tier = ANY(p.allowed_tiers)
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.promotion_sessions ps
        WHERE ps.promotion_id = p.id
          AND ps.service_id = p_service_id
      )
      OR (p.service_ids IS NOT NULL AND array_length(p.service_ids, 1) > 0 AND p_service_id = ANY(p.service_ids))
      OR NOT EXISTS (
        SELECT 1 FROM public.promotion_sessions ps
        WHERE ps.promotion_id = p.id
      )
      AND (p.service_ids IS NULL OR array_length(p.service_ids, 1) IS NULL)
    )
  ORDER BY p.created_at DESC;
END;
$$;

COMMIT;
