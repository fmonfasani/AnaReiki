-- =====================================================
-- MIGRATION: Membership Area - Database Schema
-- Description: Creates tables for user profiles and content
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- Description: Extended user profile information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TABLE: content
-- Description: Stores videos and podcast episodes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'podcast')),
  external_id TEXT NOT NULL, -- Cloudinary public_id or Spotify URL
  thumbnail_url TEXT,
  duration INTEGER, -- Duration in seconds
  is_premium BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all content
CREATE POLICY "Authenticated users can view content"
  ON public.content
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert content (admin only)
CREATE POLICY "Service role can insert content"
  ON public.content
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only service role can update content (admin only)
CREATE POLICY "Service role can update content"
  ON public.content
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Policy: Only service role can delete content (admin only)
CREATE POLICY "Service role can delete content"
  ON public.content
  FOR DELETE
  USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for content table
CREATE TRIGGER set_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON public.content(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample content for testing
/*
INSERT INTO public.content (title, description, type, external_id, is_premium) VALUES
  ('Introducción al Reiki', 'Primera clase: Fundamentos del Reiki', 'video', 'sample_video_id_1', true),
  ('Meditación Guiada', 'Meditación para principiantes', 'video', 'sample_video_id_2', true),
  ('Episodio 1: Energía Universal', 'Primer episodio del podcast', 'podcast', 'https://open.spotify.com/episode/xxxxx', true);
*/
