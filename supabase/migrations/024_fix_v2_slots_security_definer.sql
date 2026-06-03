-- =====================================================
-- MIGRATION 024: Fix v2 slot functions SECURITY DEFINER
-- 
-- get_available_slots_v2 NUNCA debe tener RLS activo
-- porque necesita leer availability_rules_v2, services
-- y appointments sin que el rol del usuario las limite.
-- =====================================================
BEGIN;

-- =============================================
-- 1. Recrear get_available_slots_v2()
--    SECURITY DEFINER + genera slots dentro del
--    rango start_time..end_time con duración
--    duration_minutes + services JOIN corregido.
-- =============================================
DROP FUNCTION IF EXISTS public.get_available_slots_v2;

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
      AND (p_modality IS NULL OR modality IN (p_modality, 'both', 'mixta'))
    ORDER BY start_time
  LOOP
    -- Ventana disponible en minutos
    v_window_minutes := EXTRACT(EPOCH FROM (v_rules.end_time - v_rules.start_time)) / 60;

    -- Generar slots de duration_minutes dentro del rango
    v_offset := 0;
    WHILE v_offset + v_rules.duration_minutes <= v_window_minutes LOOP
      RETURN QUERY
      SELECT
        (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz AS slot_start,
        (p_date + v_rules.start_time + ((v_offset + v_rules.duration_minutes) || ' minutes')::interval)::timestamptz AS slot_end,
        v_rules.id AS rule_id,
        CASE
          WHEN v_rules.modality = 'both' THEN COALESCE(p_modality, 'online')
          WHEN v_rules.modality = 'mixta' THEN COALESCE(p_modality, 'online')
          ELSE v_rules.modality
        END AS modality,
        v_rules.session_type,
        v_rules.max_participants,
        (
          SELECT COUNT(*)::INTEGER
          FROM public.appointments a
          WHERE a.start_time = (p_date + v_rules.start_time + (v_offset || ' minutes')::interval)::timestamptz
            AND a.status NOT IN ('cancelled')
        ) AS booked,
        v_rules.service_id,
        s.name AS service_name
      FROM public.services s
      WHERE s.id = v_rules.service_id OR v_rules.service_id IS NULL
      LIMIT 1;

      v_offset := v_offset + v_rules.duration_minutes;
    END LOOP;
  END LOOP;
END;
$$;

-- =============================================
-- 2. Recrear count_available_slots_v2()
--    con SECURITY DEFINER
-- =============================================
DROP FUNCTION IF EXISTS public.count_available_slots_v2;

CREATE OR REPLACE FUNCTION public.count_available_slots_v2(
  p_date     DATE,
  p_modality modality_type DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.get_available_slots_v2(p_date, p_modality) s
  WHERE s.booked < s.max_participants;
$$;

-- =============================================
-- 3. Recrear get_available_dates_v2()
--    con SECURITY DEFINER
-- =============================================
DROP FUNCTION IF EXISTS public.get_available_dates_v2;

CREATE OR REPLACE FUNCTION public.get_available_dates_v2(
  p_from     DATE,
  p_to       DATE,
  p_modality modality_type DEFAULT NULL
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
  );
END;
$$;

COMMIT;
