-- =====================================================
-- MIGRATION 021: Pending Approvals — Flujo dueño/admin
-- =====================================================
BEGIN;

-- =============================================
-- 0. AGREGAR 'gerente' AL CHECK DE ROLE
-- =============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('consultante', 'admin', 'gerente', 'owner'));

-- =============================================
-- 1. ENUM: recursos sensibles
-- =============================================
CREATE TYPE sensitive_resource AS ENUM (
  'appointment',
  'payment',
  'promotion',
  'user_role'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'expired'
);

-- =============================================
-- 2. TABLA CENTRAL
-- =============================================
CREATE TABLE IF NOT EXISTS public.pending_approvals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type    sensitive_resource NOT NULL,
  resource_id      UUID,
  requested_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  action           TEXT NOT NULL,
  payload          JSONB NOT NULL,
  status           approval_status NOT NULL DEFAULT 'pending',
  reviewed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  review_note      TEXT,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT now() + interval '72 hours'
);

CREATE INDEX idx_approvals_status    ON public.pending_approvals (status, requested_at DESC);
CREATE INDEX idx_approvals_requester ON public.pending_approvals (requested_by);
CREATE INDEX idx_approvals_resource  ON public.pending_approvals (resource_type, resource_id);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals_select_requester_or_owner"
ON public.pending_approvals FOR SELECT
USING (
  auth.uid() = requested_by
  OR public.is_owner_user()
);

CREATE POLICY "approvals_review_owner"
ON public.pending_approvals FOR UPDATE
USING (public.is_owner_user())
WITH CHECK (public.is_owner_user());

CREATE POLICY "approvals_insert_admin_or_gerente"
ON public.pending_approvals FOR INSERT
WITH CHECK (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'gerente'
  )
);

-- =============================================
-- 3. FUNCIÓN: admin/gerente solicita acción sensible
-- =============================================
CREATE OR REPLACE FUNCTION public.request_sensitive_action(
  p_resource_type  sensitive_resource,
  p_resource_id    UUID,
  p_action         TEXT,
  p_payload        JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval_id UUID;
  v_actor_role  TEXT;
BEGIN
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF v_actor_role = 'owner' THEN
    RAISE EXCEPTION 'Owner no necesita solicitar aprobación — ejecutá la acción directamente';
  END IF;

  IF v_actor_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'Sin permisos para solicitar esta acción';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pending_approvals
    WHERE resource_type = p_resource_type
      AND resource_id = p_resource_id
      AND action = p_action
      AND status = 'pending'
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Ya existe una solicitud pendiente para este recurso';
  END IF;

  INSERT INTO public.pending_approvals
    (resource_type, resource_id, requested_by, action, payload)
  VALUES
    (p_resource_type, p_resource_id, auth.uid(), p_action, p_payload)
  RETURNING id INTO v_approval_id;

  RETURN v_approval_id;
END;
$$;

-- =============================================
-- 4. FUNCIÓN: owner aprueba o rechaza
-- =============================================
CREATE OR REPLACE FUNCTION public.resolve_approval(
  p_approval_id UUID,
  p_decision    approval_status,
  p_note        TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval public.pending_approvals%ROWTYPE;
BEGIN
  IF NOT public.is_owner_user() THEN
    RAISE EXCEPTION 'Solo el owner puede aprobar o rechazar solicitudes';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decisión inválida';
  END IF;

  SELECT * INTO v_approval FROM public.pending_approvals WHERE id = p_approval_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF v_approval.status != 'pending' THEN
    RAISE EXCEPTION 'Esta solicitud ya fue resuelta (estado: %)', v_approval.status;
  END IF;

  IF v_approval.expires_at < now() THEN
    UPDATE public.pending_approvals SET status = 'expired' WHERE id = p_approval_id;
    RAISE EXCEPTION 'La solicitud expiró';
  END IF;

  UPDATE public.pending_approvals SET
    status      = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = p_note
  WHERE id = p_approval_id;

  IF p_decision = 'approved' THEN
    PERFORM public.execute_approved_action(v_approval);
  END IF;
END;
$$;

-- =============================================
-- 5. FUNCIÓN: ejecutar acción aprobada
-- =============================================
CREATE OR REPLACE FUNCTION public.execute_approved_action(
  p_approval public.pending_approvals
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_approval.resource_type = 'appointment' AND p_approval.action = 'cancel' THEN
    PERFORM public.cancel_appointment(
      p_approval.resource_id,
      p_approval.payload->>'reason',
      p_approval.reviewed_by
    );

  ELSIF p_approval.resource_type = 'appointment' AND p_approval.action = 'reschedule' THEN
    PERFORM public.admin_manage_appointment(
      p_approval.resource_id,
      NULL,
      NULL,
      (p_approval.payload->>'new_start_time')::timestamptz
    );

  ELSIF p_approval.resource_type = 'user_role' THEN
    IF (p_approval.payload->>'new_role') NOT IN ('consultante', 'admin', 'gerente', 'owner') THEN
      RAISE EXCEPTION 'Rol inválido: %', p_approval.payload->>'new_role';
    END IF;
    UPDATE public.profiles SET
      role       = p_approval.payload->>'new_role',
      updated_at = now()
    WHERE id = p_approval.resource_id;

  ELSIF p_approval.resource_type = 'payment' AND p_approval.action = 'refund' THEN
    UPDATE public.payments SET
      status = 'refunded'
    WHERE id = p_approval.resource_id;

  ELSIF p_approval.resource_type = 'promotion' AND p_approval.action = 'create' THEN
    -- Placeholder: se implementará cuando exista el módulo de promos
    NULL;

  ELSE
    RAISE EXCEPTION 'Acción no reconocida: % / %', p_approval.resource_type, p_approval.action;
  END IF;
END;
$$;

-- =============================================
-- 6. EXPIRACIÓN AUTOMÁTICA
-- =============================================
CREATE OR REPLACE FUNCTION public.expire_old_approvals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pending_approvals
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================
-- 7. CONTEO PARA BADGE (owner dashboard)
-- =============================================
CREATE OR REPLACE FUNCTION public.count_pending_approvals()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN public.is_owner_user() OR public.is_admin_user()
    THEN (SELECT COUNT(*)::integer FROM public.pending_approvals
          WHERE status = 'pending' AND expires_at > now())
    ELSE 0
  END;
$$;

COMMIT;
