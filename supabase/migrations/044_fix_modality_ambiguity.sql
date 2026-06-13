-- ============================================================
-- MIGRATION 044: Fix "column reference 'modality' is ambiguous"
-- La columna `modality` de availability_rules_v2 choca con
-- la columna RETURN TABLE `modality` dentro de la funcion.
-- Se califica como availability_rules_v2.modality.
-- ============================================================

BEGIN;

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
      IF v_rules.promotion_id IS NOT NULL THEN
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
          (SELECT COALESCE(p.service_ids[1], NULL) FROM public.promotions p WHERE p.id = v_rules.promotion_id),
          (SELECT p.name FROM public.promotions p WHERE p.id = v_rules.promotion_id)
        LIMIT 1;
      ELSIF v_rules.service_ids IS NOT NULL AND array_length(v_rules.service_ids, 1) > 0 THEN
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

CREATE OR REPLACE FUNCTION public.get_available_dates_v2(
  p_from       DATE,
  p_to         DATE,
  p_modality   modality_type DEFAULT NULL,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE(slot_date DATE)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT gs::DATE
  FROM generate_series(p_from, p_to, '1 day'::interval) gs
  WHERE EXISTS (
    SELECT 1 FROM public.get_available_slots_v2(gs::DATE, p_modality) s
    WHERE (p_service_id IS NULL OR s.service_id IS NULL OR s.service_id = p_service_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.count_available_slots_v2(
  p_date       DATE,
  p_modality   modality_type DEFAULT NULL,
  p_service_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.get_available_slots_v2(p_date, p_modality) s
  WHERE s.booked < s.max_participants
    AND (p_service_id IS NULL OR s.service_id IS NULL OR s.service_id = p_service_id);
$$;

COMMIT;
