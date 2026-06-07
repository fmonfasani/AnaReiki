ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS service_ids uuid[] DEFAULT '{}';
