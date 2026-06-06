-- =====================================================
-- MIGRATION 031: Precios independientes online/presencial
-- + service_ids array en availability_rules_v2
-- + regla multi-servicio
-- =====================================================
BEGIN;

-- 1. Agregar columnas de precio por modalidad
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_cents_online integer NOT NULL DEFAULT 0 CHECK (price_cents_online >= 0);

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_cents_presencial integer NOT NULL DEFAULT 0 CHECK (price_cents_presencial >= 0);

-- 2. Migrar datos existentes: price_cents → ambos campos
UPDATE public.services
SET price_cents_online = price_cents,
    price_cents_presencial = price_cents
WHERE price_cents_online = 0 AND price_cents_presencial = 0 AND price_cents > 0;

-- 3. Agregar service_ids array a availability_rules_v2
ALTER TABLE public.availability_rules_v2
ADD COLUMN IF NOT EXISTS service_ids uuid[] NOT NULL DEFAULT '{}';

-- 4. Migrar service_id individual al array
UPDATE public.availability_rules_v2
SET service_ids = ARRAY[service_id]
WHERE service_id IS NOT NULL AND (service_ids IS NULL OR service_ids = '{}');

-- 5. Actualizar function get_available_slots_v2 para service_ids
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_rules RECORD;
  v_window_minutes INTEGER;
  v_offset INTEGER;
  v_sid UUID;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);

  FOR v_rules IN
    SELECT * FROM public.availability_rules_v2
    WHERE is_active = true
      AND (
        (specific_date = p_date)
        OR (specific_date IS NULL AND day_of_week = v_day_of_week)
      )
      AND (p_modality IS NULL OR public.availability_rules_v2.modality IN (p_modality, 'both', 'mixta'))
    ORDER BY start_time
  LOOP
    v_window_minutes := EXTRACT(EPOCH FROM (v_rules.end_time - v_rules.start_time)) / 60;

    v_offset := 0;
    WHILE v_offset + v_rules.duration_minutes <= v_window_minutes LOOP
      IF v_rules.service_ids IS NOT NULL AND array_length(v_rules.service_ids, 1) > 0 THEN
        FOR v_sid IN SELECT unnest(v_rules.service_ids)
        LOOP
          RETURN QUERY
          SELECT
            (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz,
            (p_date + v_rules.start_time + ((v_offset + v_rules.duration_minutes) || ' minutes')::interval)::timestamptz,
            v_rules.id,
            CASE
              WHEN v_rules.modality = 'both' THEN COALESCE(p_modality, 'online')
              WHEN v_rules.modality = 'mixta' THEN COALESCE(p_modality, 'online')
              ELSE v_rules.modality
            END,
            v_rules.session_type,
            v_rules.max_participants,
            (
              SELECT COUNT(*)::INTEGER
              FROM public.appointments a
              WHERE a.start_time = (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz
                AND a.status NOT IN ('cancelled')
            ),
            v_sid,
            s.name
          FROM public.services s
          WHERE s.id = v_sid;
        END LOOP;
      ELSE
        RETURN QUERY
        SELECT
          (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz,
          (p_date + v_rules.start_time + ((v_offset + v_rules.duration_minutes) || ' minutes')::interval)::timestamptz,
          v_rules.id,
          CASE
            WHEN v_rules.modality = 'both' THEN COALESCE(p_modality, 'online')
            WHEN v_rules.modality = 'mixta' THEN COALESCE(p_modality, 'online')
            ELSE v_rules.modality
          END,
          v_rules.session_type,
          v_rules.max_participants,
          (
            SELECT COUNT(*)::INTEGER
            FROM public.appointments a
            WHERE a.start_time = (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz
              AND a.status NOT IN ('cancelled')
          ),
          NULL::UUID,
          NULL::TEXT
        LIMIT 1;
      END IF;

      v_offset := v_offset + v_rules.duration_minutes;
    END LOOP;
  END LOOP;
END;
$$;

-- 6. Indice GIN para busquedas sobre service_ids
DROP INDEX IF EXISTS idx_arv2_service;
CREATE INDEX idx_arv2_service_ids ON public.availability_rules_v2 USING GIN (service_ids);

COMMIT;
