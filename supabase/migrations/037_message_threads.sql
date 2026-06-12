-- ============================================================
-- MIGRATION 037: Message Threads (WhatsApp-style chat)
-- ============================================================
-- Convierte mensajes directos planos en chats por hilo/tema.
-- Cada thread agrupa preguntas y respuestas como un chat.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Tabla message_threads
-- ============================================================

CREATE TABLE IF NOT EXISTS public.message_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_message_threads_created_by ON public.message_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_message_threads_participant ON public.message_threads(participant_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON public.message_threads(last_message_at DESC);

-- ============================================================
-- 2. thread_id en direct_messages
-- ============================================================

ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.message_threads(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_direct_messages_thread ON public.direct_messages(thread_id);

-- ============================================================
-- 3. RLS para message_threads
-- ============================================================

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- Ver: solo participantes (creator o participant)
CREATE POLICY message_threads_select_participant ON public.message_threads
  FOR SELECT USING (
    auth.uid() = created_by OR auth.uid() = participant_id
  );

-- Crear: cualquier usuario autenticado
CREATE POLICY message_threads_insert ON public.message_threads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Actualizar: solo participantes (para close/reopen)
CREATE POLICY message_threads_update_participant ON public.message_threads
  FOR UPDATE USING (
    auth.uid() = created_by OR auth.uid() = participant_id
  ) WITH CHECK (
    auth.uid() = created_by OR auth.uid() = participant_id
  );

-- ============================================================
-- 4. Función helper: count_unread_threads
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_unread_thread_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.message_threads t
    WHERE (t.created_by = p_user_id OR t.participant_id = p_user_id)
      AND t.status = 'open'
      AND EXISTS (
        SELECT 1 FROM public.direct_messages m
        WHERE m.thread_id = t.id
          AND m.receiver_id = p_user_id
          AND m.read_at IS NULL
      )
  );
END;
$$;

-- ============================================================
-- 5. Data migration: agrupar mensajes existentes en threads
-- ============================================================
-- Estrategia:
--   a) Por cada par (consultante, admin), ordenamos mensajes cronológicamente.
--   b) Cada mensaje del consultante (sender = consultante, subject != 'Respuesta')
--      inicia un nuevo thread. El subject se usa como título.
--   c) Los replies del admin (subject = 'Respuesta') se asignan al thread
--      más reciente de ese consultante.
--   d) Mensajes sin thread quedan con thread_id = NULL (visibles aparte).

DO $$
DECLARE
  v_thread record;
  v_msg record;
  v_thread_id uuid;
  v_consultante_id uuid;
  v_admin_id uuid;
  v_last_thread_id uuid;
  v_last_consultante_id uuid;
BEGIN
  -- Encontrar admin (primer admin/owner para usar como referencia)
  SELECT id INTO v_admin_id FROM public.profiles
  WHERE role IN ('admin', 'owner') ORDER BY role = 'owner' DESC LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'No admin found, skipping data migration';
    RETURN;
  END IF;

  -- Iterar sobre mensajes de consultantes (origen de threads)
  FOR v_msg IN
    SELECT m.*, p.role as sender_role
    FROM public.direct_messages m
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.thread_id IS NULL
      AND (p.role IS NULL OR p.role NOT IN ('admin', 'owner'))
      AND COALESCE(m.subject, '') NOT IN ('Respuesta', 'Mensaje para Ana')
    ORDER BY m.sender_id, m.created_at
  LOOP
    v_consultante_id := v_msg.sender_id;

    -- Crear thread
    INSERT INTO public.message_threads (title, created_by, participant_id, last_message_at, created_at, updated_at)
    VALUES (
      COALESCE(v_msg.subject, LEFT(v_msg.content, 100)),
      v_msg.sender_id,
      v_msg.receiver_id,
      v_msg.created_at,
      v_msg.created_at,
      v_msg.created_at
    )
    RETURNING id INTO v_thread_id;

    -- Asignar este mensaje al thread
    UPDATE public.direct_messages SET thread_id = v_thread_id WHERE id = v_msg.id;

    -- Asignar replies administrativos posteriores (misma dupla, hasta 7 días después)
    UPDATE public.direct_messages
    SET thread_id = v_thread_id
    WHERE thread_id IS NULL
      AND sender_id = v_admin_id
      AND receiver_id = v_consultante_id
      AND created_at > v_msg.created_at
      AND created_at < v_msg.created_at + interval '7 days';

    v_last_thread_id := v_thread_id;
    v_last_consultante_id := v_consultante_id;
  END LOOP;

  -- Asignar sobrantes al último thread de cada consultante
  FOR v_msg IN
    SELECT m.*
    FROM public.direct_messages m
    WHERE m.thread_id IS NULL
    ORDER BY m.created_at
  LOOP
    SELECT id INTO v_thread_id FROM public.message_threads
    WHERE (created_by = v_msg.sender_id OR participant_id = v_msg.sender_id)
      AND (created_by = v_msg.receiver_id OR participant_id = v_msg.receiver_id)
    ORDER BY created_at DESC LIMIT 1;

    IF v_thread_id IS NOT NULL THEN
      UPDATE public.direct_messages SET thread_id = v_thread_id WHERE id = v_msg.id;
    END IF;
  END LOOP;

  -- Actualizar last_message_at en threads
  UPDATE public.message_threads t
  SET last_message_at = (
    SELECT MAX(m.created_at) FROM public.direct_messages m WHERE m.thread_id = t.id
  )
  WHERE EXISTS (SELECT 1 FROM public.direct_messages m WHERE m.thread_id = t.id);
END $$;

COMMIT;
