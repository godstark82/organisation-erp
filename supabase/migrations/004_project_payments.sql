-- Project-centric payments: invoice_id optional, project_id required, paid_at for timing

-- Backfill project_id from invoice when missing
UPDATE public.payments p
SET project_id = i.project_id
FROM public.invoices i
WHERE p.invoice_id = i.id
  AND p.project_id IS NULL
  AND i.project_id IS NOT NULL;

-- Drop rows that still have no project (cannot satisfy NOT NULL)
DELETE FROM public.payments WHERE project_id IS NULL;

ALTER TABLE public.payments
  ALTER COLUMN invoice_id DROP NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Prefer verified_at / created_at as initial paid_at for verified payments
UPDATE public.payments
SET paid_at = COALESCE(verified_at, created_at)
WHERE status = 'verified'
  AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(organization_id, paid_at);

-- Soften dispute invoice requirement for project-only payments
ALTER TABLE public.payment_disputes
  ALTER COLUMN invoice_id DROP NOT NULL;
