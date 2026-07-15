import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AcceptPaymentPanel } from "@/features/payments/components/accept-payment-panel"
import { DisputePanel } from "@/features/payments/components/dispute-thread"
import {
  displayPaymentStatus,
  hasClientAccepted,
  hasStaffAccepted,
} from "@/features/payments/lib/acceptance"
import { requireSession } from "@/lib/auth/session"
import {
  getPayment,
  listDisputes,
} from "@/lib/repositories/payments.repository"
import { isProjectMember } from "@/lib/repositories/projects.repository"
import {
  canAcceptPaymentsAsStaffRole,
  hasPermission,
} from "@/lib/rbac"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const session = await requireSession()
  const { id } = await params

  const payment = await getPayment(id)
  if (!payment) notFound()

  const orgId = session.profile.organization_id ?? payment.organization_id
  const disputes = await listDisputes(orgId)
  const dispute = disputes.find((d) => d.payment_id === payment.id) ?? null

  const isClient = session.profile.role === "client"
  const role = session.profile.role
  const isMember = await isProjectMember(payment.project_id, session.id)
  const canStaffAccept =
    !isClient &&
    canAcceptPaymentsAsStaffRole(role) &&
    (role === "super_admin" ||
      role === "manager" ||
      role === "accountant" ||
      isMember)
  const canDispute =
    hasPermission(session.permissions, "payments.dispute") || isClient

  const displayed = displayPaymentStatus(payment)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Payment"
        breadcrumbs={
          <Link href="/payments" className="text-muted-fg text-sm hover:text-primary">
            ← Back to payments
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display font-semibold text-xl">
          {payment.project?.name ?? payment.invoice?.invoice_number ?? "Payment"}
        </h2>
        <StatusBadge
          type="payment"
          status={displayed.status}
          label={displayed.label}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader title="Payment details" />
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Client</span>
              <span className="font-medium">{payment.client?.company_name ?? "—"}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Amount</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">UTR</span>
              <span>{payment.utr ?? "—"}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Transaction ID</span>
              <span>{payment.transaction_id ?? "—"}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Client acceptance</span>
              <span>
                {hasClientAccepted(payment)
                  ? formatDate(payment.client_accepted_at ?? payment.updated_at)
                  : "Pending"}
              </span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Team acceptance</span>
              <span>
                {hasStaffAccepted(payment)
                  ? formatDate(payment.staff_accepted_at ?? payment.updated_at)
                  : "Pending"}
              </span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Created</span>
              <span>{formatDate(payment.created_at)}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-muted-fg">Verified</span>
              <span>{payment.verified_at ? formatDate(payment.verified_at) : "—"}</span>
            </div>
            {payment.notes && (
              <div className="sm:col-span-2 border-t border-border pt-4">
                <p className="text-muted-fg text-xs uppercase">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}
            {payment.rejection_reason && (
              <div className="sm:col-span-2 rounded-lg border border-danger/30 bg-danger-subtle/20 p-3">
                <p className="font-medium text-danger text-xs uppercase">Rejection reason</p>
                <p className="mt-1 text-sm">{payment.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {payment.proofs && payment.proofs.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader title="Payment proofs" />
              <CardContent>
                <ul className="space-y-2">
                  {payment.proofs.map((proof) => (
                    <li key={proof.id}>
                      <a
                        href={proof.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        {proof.file_name}
                      </a>
                      <p className="text-muted-fg text-xs">
                        {proof.file_size
                          ? `${(proof.file_size / 1024).toFixed(1)} KB`
                          : ""}{" "}
                        · {formatDate(proof.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <AcceptPaymentPanel
            payment={payment}
            isClient={isClient}
            canStaffAccept={canStaffAccept}
          />
        </div>
      </div>

      {(dispute || canDispute) && (
        <Card className="shadow-sm">
          <CardHeader title="Dispute" description="Raise or respond to payment disputes" />
          <CardContent>
            <DisputePanel
              payment={payment}
              dispute={dispute}
              canRaiseDispute={
                canDispute &&
                !dispute &&
                ["rejected", "pending", "verified", "client_marked_paid", "under_review"].includes(
                  payment.status
                )
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
