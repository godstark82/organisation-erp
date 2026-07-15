import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { PaymentsTable } from "@/features/payments/components/payments-table"
import { fetchPaymentsPageQuery } from "@/features/payments/queries"

export default async function PaymentsPage() {
  let error: string | null = null
  let data: Awaited<ReturnType<typeof fetchPaymentsPageQuery>> | null = null

  try {
    data = await fetchPaymentsPageQuery()
  } catch {
    error = "Unable to load payments. Please try again."
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-danger-subtle-fg text-sm">
          {error}
        </p>
      )}

      {data && (
        <Suspense fallback={<LoadingSkeleton variant="table" />}>
          <PaymentsTable
            initialPayments={data.payments}
            initialTotal={data.total}
            initialPage={data.page}
            initialProjects={data.projects}
            initialClients={data.clients}
            initialProjectPaymentTotals={data.projectPaymentTotals}
            canManage={data.canManage}
            canCreate={data.canCreate}
            canEdit={data.canEdit}
            isClient={data.isClient}
            lockedClientId={data.lockedClientId}
          />
        </Suspense>
      )}
    </div>
  )
}
