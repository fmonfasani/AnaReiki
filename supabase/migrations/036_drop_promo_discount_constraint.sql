ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_discount_check;

DELETE FROM public.promotions;
