-- =====================================================
-- MIGRATION: 010 CRM Terapéutico — session_notes + tags
-- Description: Links session_notes to appointments,
--              adds tags column to profiles for segmentation,
--              creates index for analytics queries.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. LINK SESSION_NOTES TO APPOINTMENTS
-- =====================================================
ALTER TABLE public.session_notes
ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_session_notes_appointment ON public.session_notes(appointment_id);


-- =====================================================
-- 2. TAGS FOR CLIENT SEGMENTATION (profiles)
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_tags ON public.profiles USING gin(tags);


-- =====================================================
-- 3. ANALYTICS VIEW: Monthly active users
-- =====================================================
CREATE OR REPLACE VIEW public.v_monthly_active_users AS
SELECT
  date_trunc('month', created_at) AS month,
  COUNT(DISTINCT user_id) AS active_users
FROM public.daily_reflections
GROUP BY 1
ORDER BY 1 DESC;

-- =====================================================
-- 4. ANALYTICS VIEW: Retention cohorts
-- =====================================================
CREATE OR REPLACE VIEW public.v_cohort_retention AS
WITH first_activity AS (
  SELECT
    user_id,
    date_trunc('month', MIN(created_at)) AS cohort_month
  FROM public.daily_reflections
  GROUP BY user_id
),
monthly_activity AS (
  SELECT
    fa.user_id,
    fa.cohort_month,
    date_trunc('month', dr.created_at) AS activity_month
  FROM public.daily_reflections dr
  JOIN first_activity fa ON fa.user_id = dr.user_id
  GROUP BY fa.user_id, fa.cohort_month, date_trunc('month', dr.created_at)
)
SELECT
  cohort_month,
  COUNT(DISTINCT user_id) AS cohort_size,
  COUNT(DISTINCT CASE WHEN activity_month = cohort_month THEN user_id END) AS month_0,
  COUNT(DISTINCT CASE WHEN activity_month = cohort_month + interval '1 month' THEN user_id END) AS month_1,
  COUNT(DISTINCT CASE WHEN activity_month = cohort_month + interval '2 months' THEN user_id END) AS month_2,
  COUNT(DISTINCT CASE WHEN activity_month = cohort_month + interval '3 months' THEN user_id END) AS month_3
FROM first_activity
GROUP BY cohort_month
ORDER BY cohort_month DESC;


-- =====================================================
-- 5. FUNCTION: Get client analytics summary
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_client_summary(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_appointments', (SELECT COUNT(*) FROM public.appointments WHERE client_id = p_client_id),
    'completed_appointments', (SELECT COUNT(*) FROM public.appointments WHERE client_id = p_client_id AND status = 'completed'),
    'cancelled_appointments', (SELECT COUNT(*) FROM public.appointments WHERE client_id = p_client_id AND status = 'cancelled'),
    'mood_entries', (SELECT COUNT(*) FROM public.daily_reflections WHERE user_id = p_client_id),
    'avg_mood', (SELECT ROUND(AVG(mood_score)::numeric, 1) FROM public.daily_reflections WHERE user_id = p_client_id),
    'session_notes', (SELECT COUNT(*) FROM public.session_notes WHERE user_id = p_client_id),
    'days_since_last_activity', (
      SELECT EXTRACT(DAY FROM now() - MAX(created_at))::int
      FROM (
        SELECT MAX(created_at) AS created_at FROM public.daily_reflections WHERE user_id = p_client_id
        UNION ALL
        SELECT MAX(created_at) FROM public.session_notes WHERE user_id = p_client_id
      ) sub
    ),
    'joined_at', (SELECT created_at FROM public.profiles WHERE id = p_client_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMIT;
