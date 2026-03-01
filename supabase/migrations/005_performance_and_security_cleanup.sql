-- =====================================================
-- MIGRATION: 005 Performance & Security Cleanup
-- Description: Optimizes RLS performance, consolidates redundant policies, 
--              and secures database functions based on Supabase Advisor.
-- =====================================================

-- 1. SECURE DATABASE FUNCTIONS (Search Path Security)
-- This prevents search_path attacks on SECURITY DEFINER functions.
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
-- Note: is_admin_user check if it exists before altering
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_user') THEN
        ALTER FUNCTION public.is_admin_user() SET search_path = public, auth;
    END IF;
END $$;


-- 2. UTILITY: Drop all existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;


-- 3. OPTIMIZED POLICIES: PROFILES
-- Performance optimization: use (SELECT auth.uid()) instead of auth.uid()
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT 
USING ( (SELECT auth.uid()) = id OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT 
WITH CHECK ( (SELECT auth.uid()) = id );

CREATE POLICY "profiles_update_user" ON public.profiles FOR UPDATE 
USING ( (SELECT auth.uid()) = id )
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) AND
  (SELECT is_premium FROM public.profiles WHERE id = (SELECT auth.uid())) = (SELECT is_premium FROM public.profiles WHERE id = (SELECT auth.uid()))
);

CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );


-- 4. OPTIMIZED POLICIES: CONTENT
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_select" ON public.content FOR SELECT 
USING ( (SELECT auth.role()) = 'authenticated' );

CREATE POLICY "content_admin_all" ON public.content FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );


-- 5. OPTIMIZED POLICIES: AVAILABILITY
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_select" ON public.availability FOR SELECT 
USING ( true ); -- Publicly viewable for booking

CREATE POLICY "availability_admin_all" ON public.availability FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );


-- 6. OPTIMIZED POLICIES: APPOINTMENTS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT 
USING ( (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = consultant_id OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );

CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT 
WITH CHECK ( 
  (SELECT auth.uid()) = user_id AND 
  consultant_id IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "appointments_owner_all" ON public.appointments FOR ALL 
USING ( (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) = consultant_id OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );


-- 7. OPTIMIZED POLICIES: DAILY_REFLECTIONS
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflections_owner_all" ON public.daily_reflections FOR ALL 
USING ( (SELECT auth.uid()) = user_id OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );


-- 8. OPTIMIZED POLICIES: SESSION_NOTES
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_owner_all" ON public.session_notes FOR ALL 
USING ( (SELECT auth.uid()) = user_id OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin' );

-- FINAL CHECK: Ensure all tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
