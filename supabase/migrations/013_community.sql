-- =====================================================
-- MIGRATION 013: Community (FASE 5)
-- Discussions, comments, direct messaging
-- =====================================================

BEGIN;

-- =============================================
-- 1. DISCUSSION TOPICS (Forum)
-- =============================================
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'reiki', 'meditacion', 'yoga', 'experiencias', 'consultas')),
  is_pinned boolean NOT NULL DEFAULT false,
  is_closed boolean NOT NULL DEFAULT false,
  reply_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX discussion_topics_category_idx ON public.discussion_topics (category, last_activity_at DESC);
CREATE INDEX discussion_topics_pinned_idx ON public.discussion_topics (is_pinned DESC, last_activity_at DESC);

ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY discussion_topics_select
ON public.discussion_topics FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY discussion_topics_insert
ON public.discussion_topics FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY discussion_topics_update_owner
ON public.discussion_topics FOR UPDATE
USING (auth.uid() = author_id OR public.jwt_is_admin())
WITH CHECK (auth.uid() = author_id OR public.jwt_is_admin());

CREATE POLICY discussion_topics_delete_admin
ON public.discussion_topics FOR DELETE
USING (public.jwt_is_admin());

-- =============================================
-- 2. DISCUSSION REPLIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id uuid NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_solution boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX discussion_replies_topic_idx ON public.discussion_replies (topic_id, created_at);

ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY discussion_replies_select
ON public.discussion_replies FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY discussion_replies_insert
ON public.discussion_replies FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY discussion_replies_update_owner
ON public.discussion_replies FOR UPDATE
USING (auth.uid() = author_id OR public.jwt_is_admin())
WITH CHECK (auth.uid() = author_id OR public.jwt_is_admin());

CREATE POLICY discussion_replies_delete_admin
ON public.discussion_replies FOR DELETE
USING (public.jwt_is_admin());

-- =============================================
-- 3. CONTENT COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX content_comments_content_idx ON public.content_comments (content_id, created_at DESC);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_comments_select
ON public.content_comments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY content_comments_insert
ON public.content_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_comments_delete_owner
ON public.content_comments FOR DELETE
USING (auth.uid() = user_id OR public.jwt_is_admin());

-- =============================================
-- 4. DIRECT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX direct_messages_sender_idx ON public.direct_messages (sender_id, created_at DESC);
CREATE INDEX direct_messages_receiver_idx ON public.direct_messages (receiver_id, created_at DESC);
CREATE INDEX direct_messages_unread_idx ON public.direct_messages (receiver_id, read_at) WHERE read_at IS NULL;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY direct_messages_select_participant
ON public.direct_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY direct_messages_insert
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY direct_messages_update_receiver
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- =============================================
-- 5. FUNCTION: increment_reply_count
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_reply_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.discussion_topics
  SET reply_count = reply_count + 1,
      last_activity_at = timezone('utc'::text, now())
  WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_reply_count ON public.discussion_replies;
CREATE TRIGGER trg_increment_reply_count
AFTER INSERT ON public.discussion_replies
FOR EACH ROW
EXECUTE FUNCTION public.increment_reply_count();

-- =============================================
-- 6. FUNCTION: get_unread_message_count
-- =============================================
CREATE OR REPLACE FUNCTION public.get_unread_message_count(
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.direct_messages
  WHERE receiver_id = p_user_id
    AND read_at IS NULL;
  RETURN v_count;
END;
$$;

COMMIT;
