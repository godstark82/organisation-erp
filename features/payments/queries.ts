"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments, getPayment } from "@/lib/repositories/payments.repository"
import { listProjects } from "@/lib/repositories/projects.repository"
import { hasPermission } from "@/lib/rbac"

export async function fetchPaymentsPageQuery(projectId?: string) {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const canManage = hasPermission(session.permissions, "payments.create")

  const [payments, projects, clients] = await Promise.all([
    listPayments({
      organizationId: orgId,
      ...(projectId ? { projectId } : {}),
    }),
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
  ])

  return { payments, projects, clients, canManage }
}

export async function fetchPaymentQuery(id: string) {
  await requireSession()
  const payment = await getPayment(id)
  if (!payment) throw new Error("Payment not found")
  return payment
}
