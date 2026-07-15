"use server"

import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import { getClientByPortalUserId } from "@/lib/repositories/clients.repository"
import { listClients } from "@/lib/repositories/clients.repository"
import {
  getPayment,
  listPaymentAmounts,
  listPaymentsPage,
} from "@/lib/repositories/payments.repository"
import { PAYMENTS_PAGE_SIZE } from "@/lib/constants"
import { listProjects } from "@/lib/repositories/projects.repository"
import { hasPermission } from "@/lib/rbac"
import { buildProjectPaymentTotals } from "@/features/payments/lib/project-totals"
import type { PaymentStatus } from "@/types"

export type PaymentsListFilters = {
  projectId?: string
  page?: number
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export async function fetchPaymentsPageQuery(
  filters: PaymentsListFilters = {}
) {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID
  const isClient = session.profile.role === "client"
  const canCreate = hasPermission(session.permissions, "payments.create")
  // Clients can create records but not edit/verify admin-managed ones from the list
  const canEdit = canCreate && !isClient

  const linkedClient = isClient
    ? await getClientByPortalUserId(session.id)
    : null

  const page = Math.max(1, filters.page ?? 1)
  const status = filters.status
    ? (filters.status as PaymentStatus)
    : undefined

  const [paymentsPage, projects, clients, paymentAmounts] = await Promise.all([
    listPaymentsPage({
      organizationId: orgId,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(linkedClient?.id ? { clientId: linkedClient.id } : {}),
      ...(status ? { status } : {}),
      ...(filters.search?.trim()
        ? { search: filters.search.trim() }
        : {}),
      ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
      ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
      limit: PAYMENTS_PAGE_SIZE,
      offset: (page - 1) * PAYMENTS_PAGE_SIZE,
    }),
    listProjects({ organizationId: orgId }),
    listClients({ organizationId: orgId }),
    listPaymentAmounts(orgId),
  ])

  return {
    payments: paymentsPage.items,
    total: paymentsPage.total,
    page,
    pageSize: PAYMENTS_PAGE_SIZE,
    projects,
    clients,
    projectPaymentTotals: buildProjectPaymentTotals(paymentAmounts),
    canManage: canCreate,
    canCreate,
    canEdit,
    isClient,
    lockedClientId: linkedClient?.id ?? null,
  }
}

export async function fetchPaymentQuery(id: string) {
  await requireSession()
  const payment = await getPayment(id)
  if (!payment) throw new Error("Payment not found")
  return payment
}
