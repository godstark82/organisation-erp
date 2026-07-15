-- Dual acceptance: payments become verified only when both the client and
-- a project developer (or super admin / manager) have accepted.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS client_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS staff_accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill existing rows
UPDATE public.payments
SET
  client_accepted_at = COALESCE(client_accepted_at, paid_at, created_at),
  client_accepted_by = COALESCE(client_accepted_by, created_by),
  staff_accepted_at = COALESCE(staff_accepted_at, verified_at),
  staff_accepted_by = COALESCE(staff_accepted_by, verified_by)
WHERE status = 'verified';

UPDATE public.payments
SET
  client_accepted_at = COALESCE(client_accepted_at, paid_at, updated_at, created_at),
  client_accepted_by = COALESCE(client_accepted_by, created_by),
  status = 'pending'
WHERE status IN ('client_marked_paid', 'under_review');

UPDATE public.payments
SET
  staff_accepted_at = COALESCE(staff_accepted_at, created_at),
  staff_accepted_by = COALESCE(staff_accepted_by, created_by)
WHERE status = 'pending'
  AND staff_accepted_at IS NULL
  AND client_accepted_at IS NULL
  AND created_by IS NOT NULL
  AND created_by NOT IN (SELECT portal_user_id FROM public.clients WHERE portal_user_id IS NOT NULL);

UPDATE public.payments
SET
  client_accepted_at = COALESCE(client_accepted_at, created_at),
  client_accepted_by = COALESCE(client_accepted_by, created_by)
WHERE status = 'pending'
  AND client_accepted_at IS NULL
  AND created_by IN (SELECT portal_user_id FROM public.clients WHERE portal_user_id IS NOT NULL);

-- Allow project members (developers) to read payments for their projects
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT
  USING (
    organization_id = public.current_user_org_id()
    AND (
      public.current_user_role() IN ('super_admin', 'manager', 'accountant')
      OR (
        public.current_user_role() = 'client'
        AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = payments.project_id
          AND pm.user_id = auth.uid()
      )
    )
  );

-- Client can accept (or re-accept after reject) without setting status to verified
DROP POLICY IF EXISTS payments_client_mark_paid ON public.payments;
CREATE POLICY payments_client_accept ON public.payments FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'client'
    AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
    AND status IN ('pending', 'rejected', 'client_marked_paid', 'under_review')
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'client'
    AND client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
    AND status IN ('pending', 'verified')
    AND (
      status = 'pending'
      OR (
        status = 'verified'
        AND staff_accepted_at IS NOT NULL
        AND client_accepted_at IS NOT NULL
      )
    )
  );

-- Project members may update acceptance / reject on their project payments
DROP POLICY IF EXISTS payments_project_member_manage ON public.payments;
CREATE POLICY payments_project_member_manage ON public.payments FOR UPDATE
  USING (
    organization_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = payments.project_id
        AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = payments.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Client insert: pending only; creator counts as client acceptance
DROP POLICY IF EXISTS payments_client_insert ON public.payments;
CREATE POLICY payments_client_insert ON public.payments FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'client'
    AND client_id IN (
      SELECT id FROM public.clients WHERE portal_user_id = auth.uid()
    )
    AND status = 'pending'
    AND verified_by IS NULL
    AND verified_at IS NULL
    AND client_accepted_at IS NOT NULL
    AND staff_accepted_at IS NULL
  );

-- Dual acceptance verification rule
CREATE OR REPLACE FUNCTION public.enforce_payment_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
  is_member boolean;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id AND pm.user_id = auth.uid()
  ) INTO is_member;

  IF user_role = 'client' THEN
    IF NEW.status IN ('under_review', 'disputed') THEN
      RAISE EXCEPTION 'Clients cannot set this payment status';
    END IF;
    IF NEW.status = 'verified'
       AND (NEW.client_accepted_at IS NULL OR NEW.staff_accepted_at IS NULL) THEN
      RAISE EXCEPTION 'Both client and staff must accept before verification';
    END IF;
    IF NEW.staff_accepted_at IS DISTINCT FROM OLD.staff_accepted_at
       OR NEW.staff_accepted_by IS DISTINCT FROM OLD.staff_accepted_by THEN
      RAISE EXCEPTION 'Clients cannot set staff acceptance';
    END IF;
  END IF;

  IF NEW.status = 'verified' THEN
    IF NEW.client_accepted_at IS NULL OR NEW.staff_accepted_at IS NULL THEN
      RAISE EXCEPTION 'Both client and staff must accept before verification';
    END IF;
    IF user_role NOT IN ('super_admin', 'manager', 'accountant', 'client')
       AND NOT is_member THEN
      RAISE EXCEPTION 'Not allowed to verify this payment';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
