-- Migration 029: Dashboard Enhancement
-- Oracle quotes + session_history + streak milestones
-- =====================================================

BEGIN;

-- 1. Oracle Quotes
CREATE TABLE IF NOT EXISTS public.oracle_quotes (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote text NOT NULL,
  author text DEFAULT 'Ana Reiki',
  category text DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.oracle_quotes ENABLE ROW LEVEL SECURITY;

-- Seed quotes
INSERT INTO public.oracle_quotes (quote, author, category) VALUES
  ('Respirá profundo y recordá: el cuerpo siempre te habla con ternura.', 'Ana Reiki', 'respiracion'),
  ('Convocá un momento de silencio y escuchá lo que tu intuición quiere revelar.', 'Ana Reiki', 'intuicion'),
  ('La presencia consciente hoy abre la puerta a nuevas oportunidades.', 'Ana Reiki', 'presencia'),
  ('Elegí la gratitud y permití que el equilibrio se convierta en tu brújula.', 'Ana Reiki', 'gratitud'),
  ('Cada exhalación deja ir lo que ya no sirve; cada inhalación recibe claridad.', 'Ana Reiki', 'respiracion'),
  ('Construí tu día desde la calma, y el resto se alinea desde adentro.', 'Ana Reiki', 'calma'),
  ('Tu cuerpo es el templo de tu alma. Escuchalo con amor y paciencia.', 'Ana Reiki', 'cuerpo'),
  ('No hay prisa. Cada proceso tiene su tiempo sagrado.', 'Ana Reiki', 'paciencia'),
  ('Hoy es un buen día para soltar lo que ya no te pesa.', 'Ana Reiki', 'soltar'),
  ('La sanación no es lineal. Confiá en cada paso del camino.', 'Ana Reiki', 'sanacion'),
  ('Tu respiración es el ancla que te trae de vuelta a tu centro.', 'Ana Reiki', 'respiracion'),
  ('Cada pensamiento de amor que elegís transforma tu realidad.', 'Ana Reiki', 'amor'),
  ('Escuchá el susurro de tu alma antes que el grito del estrés.', 'Ana Reiki', 'intuicion'),
  ('La gratitud convierte lo ordinario en magia.', 'Ana Reiki', 'gratitud'),
  ('Permitite descansar. La pausa también es parte del camino.', 'Ana Reiki', 'calma'),
  ('Hoy elegís: soltar el control y abrazar la confianza.', 'Ana Reiki', 'soltar'),
  ('Cada célula de tu cuerpo vibra con la intención que ponés en tu corazón.', 'Ana Reiki', 'intencion'),
  ('El silencio no es vacío, es el espacio donde nace la claridad.', 'Ana Reiki', 'presencia'),
  ('No necesitás estar bien todo el tiempo. Necesitás ser auténtico.', 'Ana Reiki', 'autenticidad'),
  ('Hoy merecés paz. No tenés que ganártela, solo recibirla.', 'Ana Reiki', 'paz');

-- RLS: anyone can read active quotes, only admin/owner can manage
CREATE POLICY "oracle_quotes_read_active" ON public.oracle_quotes
  FOR SELECT USING (is_active = true);

-- 2. Session History (consultant self-journal)
CREATE TABLE IF NOT EXISTS public.session_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  mood_before integer CHECK (mood_before BETWEEN 1 AND 5),
  mood_after integer CHECK (mood_after BETWEEN 1 AND 5),
  tags text[] DEFAULT '{}',
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_session_history_user ON public.session_history(user_id);
CREATE INDEX idx_session_history_created ON public.session_history(created_at DESC);

-- RLS: users manage own, admins view all
CREATE POLICY "session_history_own" ON public.session_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "session_history_admin_read" ON public.session_history
  FOR SELECT USING (public.is_admin_user());

-- 3. Streak milestones (gamification)
CREATE TABLE IF NOT EXISTS public.streak_milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  last_entry_date date,
  milestones integer[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.streak_milestones ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_streak_milestones_user ON public.streak_milestones(user_id);

-- RLS: users see own, admins see all
CREATE POLICY "streak_milestones_own" ON public.streak_milestones
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "streak_milestones_admin_read" ON public.streak_milestones
  FOR SELECT USING (public.is_admin_user());

-- Function to update streak when mood is logged
CREATE OR REPLACE FUNCTION public.update_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_last_date date;
  v_milestones integer[];
BEGIN
  -- Get current streak data
  SELECT current_streak, last_entry_date, COALESCE(milestones, '{}')
  INTO v_streak, v_last_date, v_milestones
  FROM public.streak_milestones
  WHERE user_id = NEW.user_id;

  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO public.streak_milestones (user_id, current_streak, max_streak, last_entry_date, milestones)
    VALUES (NEW.user_id, 1, 1, NEW.created_at::date, '{}');
    RETURN NEW;
  END IF;

  -- Calculate new streak
  IF v_last_date IS NULL THEN
    v_streak := 1;
  ELSIF v_last_date = NEW.created_at::date - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_last_date = NEW.created_at::date THEN
    RETURN NEW;
  ELSE
    v_streak := 1;
  END IF;

  -- Check milestones
  IF v_streak IN (7, 30, 60, 90, 180, 365) AND NOT (v_streak = ANY(v_milestones)) THEN
    v_milestones := array_append(v_milestones, v_streak);
  END IF;

  UPDATE public.streak_milestones
  SET current_streak = v_streak,
      max_streak = GREATEST(max_streak, v_streak),
      last_entry_date = NEW.created_at::date,
      milestones = v_milestones,
      updated_at = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_streak
  AFTER INSERT ON public.daily_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak();

-- 4. Ensure daily_reflections has intention column (it should already via migration 003)
-- Add index for streak calculation
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date
  ON public.daily_reflections(user_id, created_at DESC);

COMMIT;
