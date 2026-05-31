-- =====================================================
-- MIGRATION 011: Smart Agenda (FASE 3)
-- Waitlist, Recurring Appointments, Reminder tracking
-- =====================================================

BEGIN;

-- =============================================
-- 1. WAITLIST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  preferred_date date NOT NULL,
  preferred_start_time time NOT NULL,
  preferred_end_time time NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'cancelled', 'fulfilled')),
  notified_at timestamptz,
  fulfilled_by uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX waitlist_consultant_status_idx ON public.waitlist (consultant_id, status);
CREATE INDEX waitlist_date_idx ON public.waitlist (preferred_date);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY waitlist_select_owner
ON public.waitlist FOR SELECT
USING (auth.uid() = client_id OR public.jwt_is_admin());

CREATE POLICY waitlist_insert_owner
ON public.waitlist FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY waitlist_update_admin
ON public.waitlist FOR UPDATE
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

CREATE POLICY waitlist_delete_owner
ON public.waitlist FOR DELETE
USING (auth.uid() = client_id);

-- =============================================
-- 2. RECURRING APPOINTMENTS TEMPLATE
-- =============================================
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly')),
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX recurring_templates_client_idx ON public.recurring_templates (client_id, is_active);

ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY recurring_templates_select_owner
ON public.recurring_templates FOR SELECT
USING (auth.uid() = client_id OR public.jwt_is_admin());

CREATE POLICY recurring_templates_insert_owner
ON public.recurring_templates FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY recurring_templates_update_owner
ON public.recurring_templates FOR UPDATE
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY recurring_templates_delete_owner
ON public.recurring_templates FOR DELETE
USING (auth.uid() = client_id);

CREATE POLICY recurring_templates_admin_all
ON public.recurring_templates FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- =============================================
-- 3. APPOINTMENT REMINDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'whatsapp')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX appointment_reminders_pending_idx ON public.appointment_reminders (status, scheduled_for) WHERE status = 'pending';

ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointment_reminders_admin_all
ON public.appointment_reminders FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- =============================================
-- 4. TRIGGER: Auto-create reminder when appointment is confirmed
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_schedule_reminder()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_reminder_time timestamptz;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    v_reminder_time := NEW.start_time - interval '24 hours';
    IF v_reminder_time > timezone('utc'::text, now()) THEN
      INSERT INTO public.appointment_reminders (appointment_id, type, scheduled_for)
      VALUES (NEW.id, 'email', v_reminder_time);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_schedule_reminder ON public.appointments;
CREATE TRIGGER trg_auto_schedule_reminder
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION public.auto_schedule_reminder();

-- =============================================
-- 5. FUNCTION: check_waitlist — called when an appointment is cancelled
-- =============================================
CREATE OR REPLACE FUNCTION public.check_waitlist(
  p_consultant_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS TABLE(
  waitlist_id uuid,
  client_id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.client_id,
    u.email::text
  FROM public.waitlist w
  JOIN auth.users u ON u.id = w.client_id
  WHERE w.consultant_id = p_consultant_id
    AND w.status = 'waiting'
    AND w.preferred_date = (p_start_time AT TIME ZONE 'UTC')::date
    AND w.preferred_start_time >= (p_start_time AT TIME ZONE 'UTC')::time
    AND w.preferred_end_time <= (p_end_time AT TIME ZONE 'UTC')::time
  ORDER BY w.created_at ASC
  LIMIT 1;
END;
$$;

-- =============================================
-- 6. FUNCTION: get_agenda_stats — admin analytics
-- =============================================
CREATE OR REPLACE FUNCTION public.get_agenda_stats(
  p_consultant_id uuid,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_appointments', COUNT(*),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'no_show', COUNT(*) FILTER (WHERE status = 'no_show'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'cancellation_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
        NULLIF(COUNT(*)::numeric, 0)) * 100, 1
    ),
    'avg_sessions_per_client', (
      SELECT ROUND(AVG(cnt)::numeric, 1)
      FROM (
        SELECT client_id, COUNT(*) as cnt
        FROM appointments
        WHERE consultant_id = p_consultant_id
          AND created_at >= timezone('utc'::text, now()) - (p_days || ' days')::interval
        GROUP BY client_id
      ) sub
    ),
    'peak_day', (
      SELECT EXTRACT(DOW FROM start_time)::integer
      FROM appointments
      WHERE consultant_id = p_consultant_id
        AND created_at >= timezone('utc'::text, now()) - (p_days || ' days')::interval
      GROUP BY EXTRACT(DOW FROM start_time)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'peak_hour', (
      SELECT EXTRACT(HOUR FROM start_time)::integer
      FROM appointments
      WHERE consultant_id = p_consultant_id
        AND created_at >= timezone('utc'::text, now()) - (p_days || ' days')::interval
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO v_result
  FROM public.appointments
  WHERE consultant_id = p_consultant_id
    AND created_at >= timezone('utc'::text, now()) - (p_days || ' days')::interval;

  RETURN v_result;
END;
$$;

COMMIT;
