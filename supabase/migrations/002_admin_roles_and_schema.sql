-- =====================================================
-- MIGRATION: Admin Panel & Availability Schema
-- Description: Adds roles to profiles and creates availability table
-- =====================================================

-- 1. Add 'role' column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Create 'availability' table for the Agenda
CREATE TABLE IF NOT EXISTS public.availability (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (day_of_week, start_time, end_time)
);

-- Enable RLS on availability
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS Policies for Profiles (Admin Access)

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Admins can update all profiles (e.g. set is_premium)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- 4. RLS Policies for Availability

-- Policy: Everyone can view availability (to book appointments)
CREATE POLICY "Everyone can view availability" 
ON public.availability FOR SELECT 
USING (true);

-- Policy: Only Admins can manage availability
CREATE POLICY "Admins can insert availability" 
ON public.availability FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update availability" 
ON public.availability FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete availability" 
ON public.availability FOR DELETE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
