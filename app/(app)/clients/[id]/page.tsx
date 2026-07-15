import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ClientDetailView } from "@/features/clients/components/client-detail-view"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listActivityLogs } from "@/lib/repositories/activity.repository"
import { getClient } from "@/lib/repositories/clients.repository"
import { listInternalNotes } from "@/lib/repositories/comments.repository"
import { listPayments } from "@/lib/repositories/payments.repository"
import { getProfile } from "@/lib/repositories/profiles.repository"
import { listProjects } from "@/lib/repositories/projects.repository"
import { canSeeInternalNotes, hasPermission } from "@/lib/rbac"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await requireSession()
  const { id } = await params
  const orgId = session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "clients.update")
  const canGrantPortalAccess =
    hasPermission(session.permissions, "users.manage") ||
    hasPermission(session.permissions, "clients.update")
  const showInternalNotes = canSeeInternalNotes(session.profile.role)

  const client = await getClient(id)
  if (!client || client.organization_id !== orgId) {
    notFound()
  }

  const [projects, payments, activities, internalNotes, portalProfile] =
    await Promise.all([
      listProjects({ organizationId: orgId, clientId: id }),
      listPayments({ organizationId: orgId, clientId: id }),
      listActivityLogs({
        organizationId: orgId,
        entityType: "client",
        entityId: id,
        limit: 20,
      }),
      showInternalNotes
        ? listInternalNotes("client", id, session.profile.role)
        : Promise.resolve([]),
      client.portal_user_id
        ? getProfile(client.portal_user_id)
        : Promise.resolve(null),
    ])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title={client.company_name}
        description={`${client.client_name} · ${client.email}`}
        breadcrumbs={
          <nav className="text-muted-fg text-sm">
            <Link href="/clients" className="hover:text-fg hover:underline">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-fg">{client.company_name}</span>
          </nav>
        }
      />

      <ClientDetailView
        client={client}
        projects={projects}
        payments={payments}
        activities={activities}
        internalNotes={internalNotes}
        canManage={canManage}
        canGrantPortalAccess={canGrantPortalAccess}
        canSeeNotes={showInternalNotes}
        portalProfile={portalProfile}
      />
    </div>
  )
}
