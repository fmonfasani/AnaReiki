-- =====================================================
-- MIGRATION 012: Content Library (FASE 4)
-- Progress tracking, favorites, categories, premium gating
-- =====================================================

BEGIN;

-- =============================================
-- 1. CONTENT CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.content_categories (name, slug, description, icon, sort_order) VALUES
  ('Meditaciones', 'meditaciones', 'Meditaciones guiadas para relajación y conexión', 'self_improvement', 1),
  ('Reiki', 'reiki', 'Sesiones y explicaciones sobre Reiki', 'healing', 2),
  ('Yoga', 'yoga', 'Clases de yoga y estiramientos', 'sunny', 3),
  ('Reflexiones', 'reflexiones', 'Podcast y charlas inspiradoras', 'psychology', 4),
  ('Ejercicios', 'ejercicios', 'Ejercicios terapéuticos y de respiración', 'exercise', 5)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_categories_select_all
ON public.content_categories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY content_categories_admin_all
ON public.content_categories FOR ALL
USING (public.jwt_is_admin())
WITH CHECK (public.jwt_is_admin());

-- Add category_id to content table
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.content_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS content_category_idx ON public.content (category_id);

-- =============================================
-- 2. CONTENT PROGRESS (watch/resume tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  progress_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, content_id)
);

CREATE INDEX content_progress_user_idx ON public.content_progress (user_id, last_watched_at DESC);
CREATE INDEX content_progress_continue_idx ON public.content_progress (user_id, completed) WHERE completed = false;

ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_progress_select_owner
ON public.content_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY content_progress_insert_owner
ON public.content_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_progress_update_owner
ON public.content_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_progress_delete_owner
ON public.content_progress FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 3. CONTENT FAVORITES
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, content_id)
);

CREATE INDEX content_favorites_user_idx ON public.content_favorites (user_id, created_at DESC);

ALTER TABLE public.content_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_favorites_select_owner
ON public.content_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY content_favorites_insert_owner
ON public.content_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_favorites_delete_owner
ON public.content_favorites FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY content_favorites_admin_select
ON public.content_favorites FOR SELECT
USING (public.jwt_is_admin());

-- =============================================
-- 4. FUNCTION: get_content_library
-- Returns all content with user's progress and favorite status
-- =============================================
CREATE OR REPLACE FUNCTION public.get_content_library(
  p_user_id uuid,
  p_type text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'type', c.type,
      'external_id', c.external_id,
      'thumbnail_url', c.thumbnail_url,
      'duration', c.duration,
      'is_premium', c.is_premium,
      'published_at', c.published_at,
      'category_id', c.category_id,
      'category_name', cat.name,
      'category_slug', cat.slug,
      'progress_seconds', COALESCE(cp.progress_seconds, 0),
      'completed', COALESCE(cp.completed, false),
      'is_favorite', CASE WHEN cf.id IS NOT NULL THEN true ELSE false END,
      'last_watched_at', cp.last_watched_at
    )
    ORDER BY c.published_at DESC
  ) INTO v_result
  FROM public.content c
  LEFT JOIN public.content_categories cat ON cat.id = c.category_id
  LEFT JOIN public.content_progress cp ON cp.content_id = c.id AND cp.user_id = p_user_id
  LEFT JOIN public.content_favorites cf ON cf.content_id = c.id AND cf.user_id = p_user_id
  WHERE (p_type IS NULL OR c.type = p_type)
    AND (p_category_id IS NULL OR c.category_id = p_category_id);

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =============================================
-- 5. FUNCTION: save_content_progress
-- Called periodically as user watches
-- =============================================
CREATE OR REPLACE FUNCTION public.save_content_progress(
  p_user_id uuid,
  p_content_id uuid,
  p_progress_seconds integer,
  p_duration_seconds integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_progress (user_id, content_id, progress_seconds, duration_seconds, last_watched_at)
  VALUES (p_user_id, p_content_id, p_progress_seconds, p_duration_seconds, timezone('utc'::text, now()))
  ON CONFLICT (user_id, content_id)
  DO UPDATE SET
    progress_seconds = GREATEST(content_progress.progress_seconds, p_progress_seconds),
    duration_seconds = COALESCE(p_duration_seconds, content_progress.duration_seconds),
    completed = CASE WHEN p_duration_seconds IS NOT NULL AND p_progress_seconds >= p_duration_seconds * 0.9 THEN true ELSE content_progress.completed END,
    last_watched_at = timezone('utc'::text, now());
END;
$$;

COMMIT;
