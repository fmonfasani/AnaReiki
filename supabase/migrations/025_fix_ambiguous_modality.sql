-- =====================================================
-- MIGRATION 025: Fix ambiguous column "modality" in
-- get_available_slots_v2 WHERE clause.
-- 
-- Causa: RETURNS TABLE(modality modality_type, ...)
-- introduce una columna de salida llamada modality que
-- entra en conflicto con availability_rules_v2.modality
-- en el FOR loop SELECT.
-- =====================================================
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
        v_rules.service_id,
        s.name
      FROM public.services s
      WHERE s.id = v_rules.service_id OR v_rules.service_id IS NULL
      LIMIT 1;

      v_offset := v_offset + v_rules.duration_minutes;
    END LOOP;
  END LOOP;
END;
$$;

COMMIT;
