-- Migration 032: Promo-Service Integration
-- ============================================
-- Vincula promos a servicios, agrega tracking de descuento en appointments,
-- y agrega seña (depósito porcentual) a servicios.
-- Todas las operaciones son idempotentes (IF NOT EXISTS / IF EXISTS).

BEGIN;

-- ============================================================
-- 1. Vincular promotion_sessions a services
-- ============================================================

ALTER TABLE public.promotion_sessions
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;

-- ============================================================
-- 2. Tracking de promo en appointments
-- ============================================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS original_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (original_price_cents >= 0);

-- ============================================================
-- 3. Seña (depósito porcentual) en servicios
-- ============================================================

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS deposit_percent INTEGER NOT NULL DEFAULT 0 CHECK (deposit_percent >= 0 AND deposit_percent <= 100);

-- ============================================================
-- 4. Vistas útiles para consultar promos disponibles
-- ============================================================

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
  expires_at TIMESTAMPTZ
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
    p.expires_at
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
      OR NOT EXISTS (
        SELECT 1 FROM public.promotion_sessions ps
        WHERE ps.promotion_id = p.id
      )
    )
  ORDER BY p.created_at DESC;
END;
$$;

COMMIT;
