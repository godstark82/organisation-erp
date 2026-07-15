-- Allow linked client portal users to insert payment records for their own projects.
-- They cannot verify payments (status restricted + existing enforce_payment_verification trigger).

DROP POLICY IF EXISTS payments_client_insert ON public.payments;
CREATE POLICY payments_client_insert ON public.payments FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org_id()
    AND public.current_user_role() = 'client'
    AND client_id IN (
      SELECT id FROM public.clients WHERE portal_user_id = auth.uid()
    )
    AND status IN ('pending', 'client_marked_paid')
    AND verified_by IS NULL
    AND verified_at IS NULL
  );
