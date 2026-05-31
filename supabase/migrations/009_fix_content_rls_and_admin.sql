-- =====================================================
-- MIGRATION: 009 Fix Content RLS & Admin Consistency
-- Description: Replaces service_role-only policies with jwt_is_admin(),
--              adds missing updated_at columns, and ensures admin
--              users can manage content via the admin panel UI.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX CONTENT RLS: Replace service_role with jwt_is_admin()
-- =====================================================

DROP POLICY IF EXISTS "content_admin_all" ON public.content;
DROP POLICY IF EXISTS "content_select" ON public.content;
DROP POLICY IF EXISTS "Service role can insert content" ON public.content;
DROP POLICY IF EXISTS "Service role can update content" ON public.content;
DROP POLICY IF EXISTS "Service role can delete content" ON public.content;

-- Allow all authenticated users to SELECT (already the case)
CREATE POLICY "content_select" ON public.content FOR SELECT
USING ( (SELECT auth.role()) = 'authenticated' );

-- Allow admins (via jwt_is_admin) to INSERT/UPDATE/DELETE
CREATE POLICY "content_admin_all" ON public.content FOR ALL
USING ( public.jwt_is_admin() )
WITH CHECK ( public.jwt_is_admin() );

-- Keep service_role as a backup for server-side operations
CREATE POLICY "content_service_role_all" ON public.content FOR ALL
USING ( auth.role() = 'service_role' )
WITH CHECK ( auth.role() = 'service_role' );


-- =====================================================
-- 2. ADD MISSING COLUMNS FOR CONSISTENCY
-- =====================================================

-- Add updated_at to tables that are missing it
ALTER TABLE public.daily_reflections
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.session_notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- =====================================================
-- 3. TRIGGERS FOR auto-updated_at ON NEW TABLES
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_daily_reflections_updated_at
  BEFORE UPDATE ON public.daily_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- 4. FIX SESSION_NOTES RLS: Allow users to see is_private=true
--    if they are an admin (currently users only see non-private)
-- =====================================================

DROP POLICY IF EXISTS "notes_owner_all" ON public.session_notes;

CREATE POLICY "notes_owner_all" ON public.session_notes FOR ALL
USING (
  (SELECT auth.uid()) = user_id
  OR public.jwt_is_admin()
);


-- =====================================================
-- 5. ADD INDEXES FOR NEW COLUMNS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appointments_confirmed_at ON public.appointments(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_appointments_cancelled_at ON public.appointments(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_at ON public.appointments(updated_at);

COMMIT;
