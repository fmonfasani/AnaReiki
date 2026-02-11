-- =====================================================
-- MIGRATION: Consultant Dashboard 2.0
-- Description: Tables for Mood Tracker, Session Notes, and Appointments
-- =====================================================

-- 1. Daily Reflections (Mood Tracker)
CREATE TABLE IF NOT EXISTS public.daily_reflections (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood_score integer NOT NULL CHECK (mood_score BETWEEN 1 AND 5), -- 1: Bad, 5: Excellent
    intention text,
    created_at timestamptz DEFAULT now()
);

-- 2. Session Notes (Feedback from Teacher)
CREATE TABLE IF NOT EXISTS public.session_notes (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who wrote the note
    content text NOT NULL,
    is_private boolean DEFAULT false, -- If true, only admin sees it (internal note)
    created_at timestamptz DEFAULT now()
);

-- 3. Appointments (Booking System)
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies

-- Daily Reflections: Users manage their own, Admins can view all
CREATE POLICY "Users manage their own reflections" 
ON public.daily_reflections FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all reflections" 
ON public.daily_reflections FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- Session Notes: Users read their own (non-private), Admins manage all
CREATE POLICY "Users read their public notes" 
ON public.session_notes FOR SELECT 
USING (auth.uid() = user_id AND is_private = false);

CREATE POLICY "Admins manage all notes" 
ON public.session_notes FOR ALL 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- Appointments: Users manage their own, Admins manage all
CREATE POLICY "Users manage their own appointments" 
ON public.appointments FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all appointments" 
ON public.appointments FOR ALL 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
