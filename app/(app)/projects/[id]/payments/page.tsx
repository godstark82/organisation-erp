import { notFound } from "next/navigation"
import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { PaymentsTable } from "@/features/payments/components/payments-table"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import { getProject, listProjects } from "@/lib/repositories/projects.repository"
import { hasPermission } from "@/lib/rbac"

export default async function ProjectPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const orgId = project.organization_id ?? ORG_ID
  const canManage =
    hasPermission(session.permissions, "payments.create") ||
    hasPermission(session.permissions, "payments.verify")

  const [payments, projects, clients] = await Promise.all([
    listPayments({ projectId: id, organizationId: orgId }),
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
  ])

  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <PaymentsTable
        initialPayments={payments}
        initialProjects={projects}
        initialClients={clients}
        canManage={canManage}
        defaultProjectId={id}
        embedded
      />
    </Suspense>
  )
}
