-- =====================================================
-- MIGRATION 023: Email campaigns + Sistema de Promos
-- =====================================================
BEGIN;

-- =============================================
-- 1. EMAIL CAMPAIGNS (historial de envíos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  segment         TEXT NOT NULL,
  tags            TEXT[],
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ec_admin_select"
  ON public.email_campaigns FOR SELECT
  USING (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "ec_admin_insert"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

-- =============================================
-- 2. PROMOTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  discount_percent  INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
  discount_fixed    DECIMAL(10,2),
  price_override    DECIMAL(10,2),
  allowed_tiers     TEXT[] DEFAULT '{}',
  max_purchases     INTEGER CHECK (max_purchases > 0),
  current_purchases INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  starts_at         TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_by        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_discount CHECK (
    discount_percent IS NOT NULL OR discount_fixed IS NOT NULL OR price_override IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.promotion_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  session_type  session_type NOT NULL DEFAULT 'individual',
  modality      modality_type NOT NULL DEFAULT 'both',
  session_count INTEGER NOT NULL DEFAULT 1 CHECK (session_count > 0),
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0)
);

CREATE TABLE IF NOT EXISTS public.promo_purchases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_preference_id TEXT,
  mp_payment_id    TEXT,
  amount_paid      DECIMAL(10,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  sessions_remaining INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at       TIMESTAMPTZ
);

CREATE INDEX idx_promotions_active ON public.promotions (is_active) WHERE is_active = true;
CREATE INDEX idx_promo_purchases_user ON public.promo_purchases (user_id);
CREATE INDEX idx_promo_purchases_status ON public.promo_purchases (status);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promos_select_active"
  ON public.promotions FOR SELECT
  USING (is_active = true OR public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promos_insert_admin_owner"
  ON public.promotions FOR INSERT
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promos_update_admin_owner"
  ON public.promotions FOR UPDATE
  USING (public.is_admin_user() OR public.is_owner_user())
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promos_delete_owner"
  ON public.promotions FOR DELETE
  USING (public.is_owner_user());

CREATE POLICY "promo_sessions_select"
  ON public.promotion_sessions FOR SELECT
  USING (true);

CREATE POLICY "promo_sessions_insert_admin_owner"
  ON public.promotion_sessions FOR INSERT
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promo_sessions_delete_admin_owner"
  ON public.promotion_sessions FOR DELETE
  USING (public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promo_purchases_select_own"
  ON public.promo_purchases FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin_user() OR public.is_owner_user());

CREATE POLICY "promo_purchases_insert"
  ON public.promo_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "promo_purchases_update_admin"
  ON public.promo_purchases FOR UPDATE
  USING (public.is_admin_user() OR public.is_owner_user())
  WITH CHECK (public.is_admin_user() OR public.is_owner_user());

COMMIT;
