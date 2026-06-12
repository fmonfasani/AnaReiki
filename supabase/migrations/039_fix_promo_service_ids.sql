-- ============================================================
-- MIGRATION 039: Populate service_ids from promotion_sessions
-- ============================================================
BEGIN;

UPDATE public.promotions p
SET service_ids = ARRAY(
  SELECT ps.service_id
  FROM public.promotion_sessions ps
  WHERE ps.promotion_id = p.id
    AND ps.service_id IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM public.promotion_sessions ps
  WHERE ps.promotion_id = p.id
    AND ps.service_id IS NOT NULL
);

COMMIT;
