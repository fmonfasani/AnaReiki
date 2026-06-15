-- ============================================================
-- MIGRATION 051a: Add new enum values ( COMMIT first )
-- ============================================================
-- PostgreSQL requires new enum values to be committed before use.
-- Run this FIRST, then run 051b.
-- ============================================================

-- 1. Agregar valores nuevos al enum existente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_payment' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')) THEN
    ALTER TYPE public.appointment_status ADD VALUE 'pending_payment' BEFORE 'confirmed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_confirmation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')) THEN
    ALTER TYPE public.appointment_status ADD VALUE 'pending_confirmation' BEFORE 'confirmed';
  END IF;
END $$;

-- 2. Crear tipo attendance_result
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_result_type') THEN
    CREATE TYPE public.attendance_result_type AS ENUM (
      'attended',
      'no_show',
      'rescheduled'
    );
  END IF;
END $$;

-- 3. Agregar columnas nuevas
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS attendance_result public.attendance_result_type DEFAULT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS original_appointment_id uuid DEFAULT NULL
    REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS new_appointment_id uuid DEFAULT NULL
    REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz DEFAULT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS completed_by uuid DEFAULT NULL
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Eliminar approval_status default
ALTER TABLE public.appointments
  ALTER COLUMN approval_status DROP DEFAULT;
