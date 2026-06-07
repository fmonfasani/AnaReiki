-- ============================================================
-- MIGRATION 034: Clear all appointments for fresh start
-- ============================================================
-- Elimina todos los turnos de todos los consultantes para
-- limpiar datos de prueba/desarrollo.
-- Maneja tablas que pueden no existir (IF EXISTS).
-- ============================================================

DO $$
BEGIN
  -- appointment_reminders
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointment_reminders') THEN
    DELETE FROM public.appointment_reminders;
  END IF;

  -- appointment_audit_log
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointment_audit_log') THEN
    DELETE FROM public.appointment_audit_log;
  END IF;

  -- appointments (always exists)
  DELETE FROM public.appointments;
END $$;
