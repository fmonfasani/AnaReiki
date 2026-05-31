-- ===============================================
-- MIGRATION 017: Fix RLS infinite recursion
-- ===============================================
-- CORRER EN SQL EDITOR DE SUPABASE
-- Limpia policies recursivas + recrea functions SECURITY DEFINER
-- ===============================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT oid::regprocedure AS func_name 
                FROM pg_proc 
                WHERE proname = 'is_admin_user' 
                AND pronamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'DROP FUNCTION ' || rec.func_name || ' CASCADE';
    END LOOP;

    FOR rec IN (SELECT oid::regprocedure AS func_name 
                FROM pg_proc 
                WHERE proname = 'jwt_is_admin' 
                AND pronamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'DROP FUNCTION ' || rec.func_name || ' CASCADE';
    END LOOP;

    FOR rec IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', rec.policyname);
    END LOOP;
END $$;

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

CREATE POLICY "users_view_own" ON public.profiles FOR SELECT
USING ( auth.uid() = id );

CREATE POLICY "admins_view_all" ON public.profiles FOR SELECT
USING ( public.is_admin_user() );

CREATE POLICY "users_insert_own" ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "users_update_own" ON public.profiles FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK (
  auth.uid() = id
  AND (
    public.is_admin_user()
    OR (role = 'consultante' AND NOT is_premium)
  )
);

CREATE POLICY "admins_full_access" ON public.profiles FOR ALL
USING ( public.is_admin_user() );
