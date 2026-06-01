-- 020_mp_oauth.sql
-- Almacenamiento de tokens OAuth de Mercado Pago

CREATE TABLE IF NOT EXISTS public.mp_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_user_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mp_credentials_owner ON public.mp_credentials(owner_id);
CREATE INDEX idx_mp_credentials_active ON public.mp_credentials(is_active);

ALTER TABLE public.mp_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_mp_credentials"
  ON public.mp_credentials
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_owner_user()
  );
