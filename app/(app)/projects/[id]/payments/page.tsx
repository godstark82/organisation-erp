import { notFound } from "next/navigation"
import { Suspense } from "react"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { PaymentsTable } from "@/features/payments/components/payments-table"
import { fetchPaymentsPageQuery } from "@/features/payments/queries"
import { getProject } from "@/lib/repositories/projects.repository"

export default async function ProjectPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const data = await fetchPaymentsPageQuery({ projectId: id })

  return (
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
        lockedClientId={
          data.lockedClientId ?? (data.isClient ? project.client_id : null)
        }
        defaultProjectId={id}
        embedded
      />
    </Suspense>
  )
}
