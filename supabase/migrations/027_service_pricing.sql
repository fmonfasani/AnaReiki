BEGIN;

-- 1. Agregar precio a servicios
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0);

-- 2. Agregar columnas de pago a appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending'
CHECK (payment_status IN ('pending', 'pending_payment', 'paid', 'refunded'));

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS mp_preference_id text;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS mp_payment_id text;

-- 3. Precios default sugeridos (owner los ajusta después)
UPDATE public.services SET price_cents = 5000 WHERE price_cents = 0 AND slug IN ('consulta-inicial', 'sesion-reiki');
UPDATE public.services SET price_cents = 3000 WHERE price_cents = 0 AND slug IN ('sesion-yoga', 'meditacion-guiada');

COMMIT;
