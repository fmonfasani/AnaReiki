-- ===============================================
-- MIGRATION 017: Fix RLS + Add missing RLS + Clean policies
-- Fixes:
--   1. Drop overloads de is_admin_user / jwt_is_admin
--   2. Recreate is_admin_user() SECURITY DEFINER
--   3. Migrar 4 tablas a is_admin_user()
--   4. Habilitar RLS en 3 tablas que no tenían
--   5. Dropear policy duplicada en daily_reflections
-- ===============================================

-- ===============================================
-- 1. LIMPIEZA: drop overloads + policies viejas
-- ===============================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Dropear todos los overloads de is_admin_user y jwt_is_admin
    FOR rec IN (SELECT oid::regprocedure AS func_name 
                FROM pg_proc 
                WHERE proname IN ('is_admin_user', 'jwt_is_admin')
                AND pronamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'DROP FUNCTION ' || rec.func_name || ' CASCADE';
    END LOOP;

    -- Dropear policies viejas de availability
    FOR rec IN (SELECT policyname FROM pg_policies 
                WHERE tablename = 'availability' AND schemaname = 'public'
                AND policyname LIKE 'Admins can%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.availability', rec.policyname);
    END LOOP;

    -- Dropear policies viejas de otras tablas
    DROP POLICY IF EXISTS "Admins insert content" ON public.content;
    DROP POLICY IF EXISTS "Admins ven reflexiones" ON public.daily_reflections;
    DROP POLICY IF EXISTS "Admins manage notes" ON public.session_notes;

    -- Dropear policy duplicada en daily_reflections
    DROP POLICY IF EXISTS "Users manage their own reflections" ON public.daily_reflections;

    -- Dropear policy redundante en content (sobra con "Todos ven contenido")
    DROP POLICY IF EXISTS "content_select" ON public.content;
END $$;

-- ===============================================
-- 2. RECREAR is_admin_user() (SIN overloads)
-- ===============================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ===============================================
-- 3. RECREAR jwt_is_admin()
-- ===============================================
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    public.is_admin_user()
    OR (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ===============================================
-- 4. FIX POLICIES EN availability (usar is_admin_user)
-- ===============================================
CREATE POLICY "admins_delete_availability" ON public.availability FOR DELETE
USING ( public.is_admin_user() );

CREATE POLICY "admins_insert_availability" ON public.availability FOR INSERT
WITH CHECK ( public.is_admin_user() );

CREATE POLICY "admins_update_availability" ON public.availability FOR UPDATE
USING ( public.is_admin_user() );

-- ===============================================
-- 5. FIX POLICIES EN content (admin insert)
-- ===============================================
CREATE POLICY "admins_insert_content" ON public.content FOR INSERT
WITH CHECK ( public.is_admin_user() );

-- ===============================================
-- 6. FIX POLICIES EN daily_reflections
-- ===============================================
CREATE POLICY "admins_view_reflections" ON public.daily_reflections FOR SELECT
USING ( public.is_admin_user() );

-- ===============================================
-- 7. FIX POLICIES EN session_notes
-- ===============================================
CREATE POLICY "admins_manage_notes" ON public.session_notes FOR ALL
USING ( public.is_admin_user() );

-- ===============================================
-- 8. HABILITAR RLS + AGREGAR POLICIES A TABLAS SIN RLS
-- ===============================================

-- availability_exceptions
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aex_users_select" ON public.availability_exceptions FOR SELECT
USING ( true );

CREATE POLICY "aex_admins_all" ON public.availability_exceptions FOR ALL
USING ( public.is_admin_user() );

-- availability_rules
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arules_users_select" ON public.availability_rules FOR SELECT
USING ( true );

CREATE POLICY "arules_admins_all" ON public.availability_rules FOR ALL
USING ( public.is_admin_user() );

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_users_select" ON public.services FOR SELECT
USING ( true );

CREATE POLICY "services_admins_all" ON public.services FOR ALL
USING ( public.is_admin_user() );

-- ===============================================
-- 9. VERIFICACIÓN: mostrar resumen
-- ===============================================
SELECT 'OK' AS resultado, COUNT(*) AS policies_activas
FROM pg_policies WHERE schemaname = 'public';
