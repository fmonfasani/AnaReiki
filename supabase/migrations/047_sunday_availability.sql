BEGIN;

-- Agrega disponibilidad los domingos (day_of_week = 0)
-- Busca el owner por email para created_by, skip si no existe
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'fmonfasani@gmail.com';

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.availability_rules_v2
      (day_of_week, start_time, end_time, duration_minutes, modality, created_by)
    VALUES
      (0, '09:00', '23:00', 30, 'both', v_owner_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

COMMIT;
