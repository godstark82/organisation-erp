import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { PaymentsTable } from "@/features/payments/components/payments-table"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import { listProjects } from "@/lib/repositories/projects.repository"
import { hasPermission } from "@/lib/rbac"
import type { Payment } from "@/types"

export default async function PaymentsPage() {
  const session = await requireSession()
  const orgId = session.profile.organization_id ?? ORG_ID
  const canManage =
    hasPermission(session.permissions, "payments.create") ||
    hasPermission(session.permissions, "payments.verify")

  let payments: Payment[] = []
  let error: string | null = null

  const [projects, clients] = await Promise.all([
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
  ])

  try {
    payments = await listPayments({ organizationId: orgId })
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

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <PaymentsTable
          payments={payments}
          projects={projects}
          clients={clients}
          canManage={canManage}
        />
      </Suspense>
    </div>
  )
}
