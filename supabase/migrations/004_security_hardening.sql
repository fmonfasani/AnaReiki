-- =====================================================
-- MIGRATION: 004 Security Hardening & Schema Alignment
-- Description: Fixes RLS vulnerabilities and aligns schema with code expectations
-- =====================================================

-- 1. SECURITY: Fix Profile Update Vulnerability
-- Drop the permissive policy from 001
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restrictive policy: Users can only update their own metadata (full_name, avatar_url, etc.)
-- but CANNOT change their role or is_premium status.
CREATE POLICY "Users can update own profile fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  (role = (SELECT role FROM public.profiles WHERE id = auth.uid())) AND
  (is_premium = (SELECT is_premium FROM public.profiles WHERE id = auth.uid()))
);

-- 2. SCHEMA ALIGNMENT: Update 'availability' table
ALTER TABLE public.availability 
ADD COLUMN IF NOT EXISTS consultant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS specific_date date,
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- The previous migration 002 used 'is_active', let's sync them or keep both for safety
-- but the code uses 'is_available'.

-- 3. SCHEMA ALIGNMENT: Update 'appointments' table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS consultant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. PERFORMANCE: Add missing indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_availability_consultant ON public.availability(consultant_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON public.availability(specific_date);
CREATE INDEX IF NOT EXISTS idx_appointments_consultant ON public.appointments(consultant_id);

-- 5. SECURITY: Strengthen Appointments RLS
-- Users can book, but consultant_id must be an admin
DROP POLICY IF EXISTS "Users manage their own appointments" ON public.appointments;

CREATE POLICY "Users can insert their own appointment" 
ON public.appointments FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  consultant_id IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Users can view their own appointments" 
ON public.appointments FOR SELECT 
USING (auth.uid() = user_id OR consultant_id = auth.uid());
