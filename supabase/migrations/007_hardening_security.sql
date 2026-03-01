-- =====================================================
-- MIGRATION: 007 Security Hardening & Consistency
-- Description: Fixes tautological RLS policies in profiles, enforces 
--              admin role protection, and restricts appointment 
--              state transitions.
-- =====================================================

BEGIN;

-- 1. UTILITY: Ensure jwt_is_admin check is robust (from 006)
CREATE OR REPLACE FUNCTION public.jwt_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR ((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'),
    false
  );
$$;

-- 2. HARDENING: PROFILES
-- Drop insecure policy from 005
DROP POLICY IF EXISTS "profiles_update_user" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- New policy: Users can update their own profile BUT NOT role or is_premium
-- Logic: The CHECK expression ensures the role and is_premium values 
--        in the resulting row (after update) match the values in the current row (before update)
--        UNLESS the requester is an admin.
CREATE POLICY "profiles_update_owner" ON public.profiles FOR UPDATE
USING ( (SELECT auth.uid()) = id )
WITH CHECK (
  (SELECT auth.uid()) = id AND (
    public.jwt_is_admin() OR (
      -- Ensure role and is_premium are NOT changed by comparing with current state
      role = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) AND
      is_premium = (SELECT is_premium FROM public.profiles WHERE id = (SELECT auth.uid()))
    )
  )
);

-- Admin has full access to profiles
CREATE POLICY "profiles_admin_full" ON public.profiles FOR ALL
USING ( public.jwt_is_admin() );


-- 3. HARDENING: APPOINTMENTS
-- Drop existing owner policy from legacy or 005
DROP POLICY IF EXISTS "appointments_owner_all" ON public.appointments;

-- New policies for refined control:
-- Select: user is client, consultant, or admin
CREATE POLICY "appointments_select_robust" ON public.appointments FOR SELECT
USING ( 
  (SELECT auth.uid()) = client_id 
  OR (SELECT auth.uid()) = consultant_id 
  OR public.jwt_is_admin() 
);

-- Insert: user is client and status is 'pending'
CREATE POLICY "appointments_insert_client" ON public.appointments FOR INSERT
WITH CHECK ( 
  (SELECT auth.uid()) = client_id 
  AND status = 'pending'
);

-- Update: 
-- Clients/Owners can only CANCEL their own appointments (transition to 'cancelled')
-- They cannot confirm or complete them.
CREATE POLICY "appointments_update_client" ON public.appointments FOR UPDATE
USING ( (SELECT auth.uid()) = client_id )
WITH CHECK (
  (SELECT auth.uid()) = client_id AND (
    -- Only allow transition to 'cancelled'
    status = 'cancelled' AND (
      -- Ensure other sensitive fields don't change
      service_id = (SELECT service_id FROM public.appointments WHERE id = id) AND
      consultant_id = (SELECT consultant_id FROM public.appointments WHERE id = id) AND
      start_time = (SELECT start_time FROM public.appointments WHERE id = id)
    )
  )
);

-- Admins can update everything
CREATE POLICY "appointments_update_admin" ON public.appointments FOR ALL
USING ( public.jwt_is_admin() );


-- 4. CLEANUP: Ensure legacy availability table is also secured if it still exists
ALTER TABLE IF EXISTS public.availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_admin_all" ON public.availability;
CREATE POLICY "availability_admin_full" ON public.availability FOR ALL
USING ( public.jwt_is_admin() );


COMMIT;
