-- ============================================================
-- MIGRATION 041: Promo como paquete (1 sesion con varios servicios)
-- ============================================================
-- - appointments.service_id nullable (para promos)
-- - duration_minutes en promotions (duracion total del paquete)
-- - promotion_id en availability_rules_v2 (disponibilidad para promos)
-- - get_available_slots_v2 actualizado para promos
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Hacer service_id nullable en appointments
-- ============================================================
ALTER TABLE public.appointments
ALTER COLUMN service_id DROP NOT NULL;

-- ============================================================
-- 2. Agregar duration_minutes a promotions (duracion total del paquete)
-- ============================================================
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER CHECK (duration_minutes > 0);

-- ============================================================
-- 3. Agregar promotion_id a availability_rules_v2
-- ============================================================
ALTER TABLE public.availability_rules_v2
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_arv2_promotion
ON public.availability_rules_v2 (promotion_id)
WHERE promotion_id IS NOT NULL;

-- ============================================================
-- 4. Actualizar get_available_slots_v2 para promos
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_slots_v2(
  p_date     DATE,
  p_modality modality_type DEFAULT NULL
)
RETURNS TABLE(
  slot_start       TIMESTAMPTZ,
  slot_end         TIMESTAMPTZ,
  rule_id          UUID,
  modality         modality_type,
  session_type     session_type,
  max_participants INTEGER,
  booked           INTEGER,
  service_id       UUID,
  service_name     TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_rules RECORD;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);

  FOR v_rules IN
    SELECT * FROM public.availability_rules_v2
    WHERE is_active = true
      AND (
        (specific_date = p_date)
        OR (specific_date IS NULL AND day_of_week = v_day_of_week)
      )
      AND (p_modality IS NULL OR modality IN (p_modality, 'both', 'mixta'))
    ORDER BY start_time
  LOOP
    RETURN QUERY
    SELECT
      (p_date + v_rules.start_time)::timestamptz AS slot_start,
      (p_date + v_rules.start_time + (v_rules.duration_minutes || ' minutes')::interval)::timestamptz AS slot_end,
      v_rules.id AS rule_id,
      CASE
        WHEN v_rules.modality = 'both' THEN COALESCE(p_modality, 'online')
        WHEN v_rules.modality = 'mixta' THEN COALESCE(p_modality, 'online')
        ELSE v_rules.modality
      END AS slot_modality,
      v_rules.session_type,
      v_rules.max_participants,
      (
        SELECT COUNT(*)::INTEGER
        FROM public.appointments a
        WHERE a.start_time = (p_date + v_rules.start_time)::timestamptz
          AND a.status NOT IN ('cancelled')
      ) AS booked,
      COALESCE(v_rules.service_id, (SELECT p.service_ids[1] FROM public.promotions p WHERE p.id = v_rules.promotion_id)) AS resolved_service_id,
      COALESCE(s.name, (SELECT p.name FROM public.promotions p WHERE p.id = v_rules.promotion_id)) AS resolved_service_name
    FROM public.services s
    WHERE s.id = v_rules.service_id
       OR (v_rules.service_id IS NULL AND v_rules.promotion_id IS NOT NULL)
       OR (v_rules.service_id IS NULL AND v_rules.promotion_id IS NULL AND s.id IS NULL);
  END LOOP;
END;
$$;

-- ============================================================
-- 5. Actualizar get_available_dates_v2
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_dates_v2(
  p_from     DATE,
  p_to       DATE,
  p_modality modality_type DEFAULT NULL
)
RETURNS TABLE(slot_date DATE)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT gs::DATE
  FROM generate_series(p_from, p_to, '1 day'::interval) gs
  WHERE EXISTS (
    SELECT 1 FROM public.get_available_slots_v2(gs::DATE, p_modality) s
  );
END;
$$;

COMMIT;
