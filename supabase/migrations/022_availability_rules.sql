-- =====================================================
-- MIGRATION 022: Nueva disponibilidad por reglas (v2)
-- Crea tabla availability_rules_v2 + slot generation
-- Sin breaking changes: tablas viejas siguen funcionando
-- =====================================================
BEGIN;

-- =============================================
-- 1. EXTENDER modality_type
-- =============================================
ALTER TYPE public.modality_type ADD VALUE IF NOT EXISTS 'both';
ALTER TYPE public.modality_type ADD VALUE IF NOT EXISTS 'mixta';

-- =============================================
-- 2. session_type ENUM
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.session_type AS ENUM ('individual', 'group', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 3. NUEVA availability_rules_v2
--    (strangler fig: nueva al lado de las viejas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.availability_rules_v2 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week      INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date    DATE,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  modality         modality_type NOT NULL DEFAULT 'both',
  session_type     session_type NOT NULL DEFAULT 'individual',
  max_participants INTEGER DEFAULT 1 CHECK (max_participants > 0),
  max_online       INTEGER,
  max_presencial   INTEGER,
  service_id       UUID REFERENCES public.services(id) ON DELETE SET NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_date_or_day CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL)
    OR (day_of_week IS NULL AND specific_date IS NOT NULL)
  ),
  CONSTRAINT chk_end_after_start CHECK (end_time > start_time),
  CONSTRAINT chk_mixta_participants CHECK (
    modality != 'mixta'
    OR (max_online IS NOT NULL AND max_presencial IS NOT NULL)
  )
);

CREATE INDEX idx_arv2_active_day ON public.availability_rules_v2 (is_active, day_of_week)
  WHERE day_of_week IS NOT NULL;
CREATE INDEX idx_arv2_specific_date ON public.availability_rules_v2 (specific_date)
  WHERE specific_date IS NOT NULL;
CREATE INDEX idx_arv2_service ON public.availability_rules_v2 (service_id);

ALTER TABLE public.availability_rules_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arv2_select_all_active"
  ON public.availability_rules_v2 FOR SELECT
  USING (is_active = true OR public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "arv2_insert_admin_owner"
  ON public.availability_rules_v2 FOR INSERT
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "arv2_update_admin_owner"
  ON public.availability_rules_v2 FOR UPDATE
  USING (public.is_admin_user() OR public.is_owner_user())
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "arv2_delete_owner"
  ON public.availability_rules_v2 FOR DELETE
  USING (public.is_owner_user());

-- =============================================
-- 4. GENERAR SLOTS DINÁMICAMENTE
-- =============================================
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
      v_rules.service_id,
      s.name AS service_name
    FROM public.services s
    WHERE s.id = v_rules.service_id OR v_rules.service_id IS NULL;
  END LOOP;
END;
$$;

-- =============================================
-- 5. CONTAR SLOTS DISPONIBLES
-- =============================================
CREATE OR REPLACE FUNCTION public.count_available_slots_v2(
  p_date     DATE,
  p_modality modality_type DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.get_available_slots_v2(p_date, p_modality) s
  WHERE s.booked < s.max_participants;
$$;

-- =============================================
-- 6. MIGRAR REGLAS DESDE availability_rules (v1)
--    y availability_exceptions a v2
-- =============================================
INSERT INTO public.availability_rules_v2 (
  day_of_week, start_time, end_time, duration_minutes, is_active, created_by
)
SELECT
  r.day_of_week,
  r.start_time,
  r.end_time,
  -- default duration = window end - start (in minutes), min 30
  GREATEST(30, EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 60)::INTEGER,
  r.is_active,
  r.consultant_id
FROM public.availability_rules r
ON CONFLICT DO NOTHING;

-- Excepciones: bloqueos de fecha completa se migran como reglas inactivas
INSERT INTO public.availability_rules_v2 (
  specific_date, start_time, end_time, duration_minutes, modality, is_active, created_by
)
SELECT
  e.exception_date,
  '00:00'::TIME,
  '23:59'::TIME,
  1440,
  'both',
  false,
  e.consultant_id
FROM public.availability_exceptions e
WHERE e.is_available = false
  AND e.exception_date > CURRENT_DATE
ON CONFLICT DO NOTHING;

-- Excepciones de franja horaria específica (allow) como reglas activas
INSERT INTO public.availability_rules_v2 (
  specific_date, start_time, end_time, duration_minutes, modality, is_active, created_by
)
SELECT
  e.exception_date,
  e.start_time,
  e.end_time,
  GREATEST(30, EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 60)::INTEGER,
  'both',
  true,
  e.consultant_id
FROM public.availability_exceptions e
WHERE e.is_available = true
  AND e.exception_date > CURRENT_DATE
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. OBTENER FECHAS CON DISPONIBILIDAD (para DatePicker)
-- =============================================
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
