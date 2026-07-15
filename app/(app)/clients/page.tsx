import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSkeleton } from "@/components/shared/loading-skeleton"
import { ClientsTable } from "@/features/clients/components/clients-table"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { hasPermission } from "@/lib/rbac"
import type { Client, ClientStatus } from "@/types"

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const session = await requireSession()
  const params = await searchParams
  const orgId = session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "clients.create")

  const statusParam = params.status
  const status =
    statusParam && ["active", "inactive", "lead", "archived"].includes(statusParam)
      ? (statusParam as ClientStatus)
      : undefined

  let clients: Client[] = []
  let error: string | null = null

  try {
    clients = await listClients({
      organizationId: orgId,
      search: params.search,
      status,
    })
  } catch {
    error = "Unable to load clients. Please try again."
    clients = []
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Clients"
        description="Manage client relationships, contacts, and billing details."
      />

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-danger-subtle-fg text-sm">
          {error}
        </p>
      )}

      <Suspense fallback={<LoadingSkeleton variant="table" />}>
        <ClientsTable initialClients={clients} canManage={canManage} />
      </Suspense>
    </div>
  )
}
