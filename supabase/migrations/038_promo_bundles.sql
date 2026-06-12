-- ============================================================
-- MIGRATION 038: Promo bundles (compra directa de promos)
-- ============================================================
-- Permite comprar una promo como bundle (ej: 5 sesiones por $XXX)
-- y luego usarlas al reservar servicios incluidos.
-- ============================================================

BEGIN;

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS bundle_price_cents INTEGER CHECK (bundle_price_cents >= 0);

ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS max_sessions INTEGER NOT NULL DEFAULT 1 CHECK (max_sessions > 0);

-- ============================================================
-- 3. Función para descontar sesión de promo purchase
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_promo_session(p_purchase_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_purchases
  SET sessions_remaining = GREATEST(sessions_remaining - 1, 0)
  WHERE id = p_purchase_id AND status = 'approved' AND sessions_remaining > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo descontar sesión: purchase no encontrado o sin sesiones disponibles';
  END IF;
END;
$$;

COMMIT;
