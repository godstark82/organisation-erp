import { ORG_ID } from "@/lib/data/demo-store"
import { getDashboardStats } from "@/lib/repositories/dashboard.repository"
import { listClients } from "@/lib/repositories/clients.repository"
import { listPayments, listPaymentsAwaitingVerification } from "@/lib/repositories/payments.repository"
import { listProjects } from "@/lib/repositories/projects.repository"
import type { ReportType } from "../report-config"

export interface RevenueReportData {
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  revenueSeries: { month: string; revenue: number }[]
  paymentTrend: { month: string; received: number; pending: number }[]
}

export interface ClientRevenueRow {
  clientId: string
  clientName: string
  revenue: number
  paymentCount: number
  projectCount: number
}

export interface ProjectProfitabilityRow {
  projectId: string
  projectName: string
  budget: number
  collected: number
  margin: number
  marginPercent: number
}

export interface PendingPaymentsData {
  pendingTotal: number
  overdueTotal: number
  awaitingVerification: Awaited<ReturnType<typeof listPaymentsAwaitingVerification>>
  payments: Awaited<ReturnType<typeof listPayments>>
}

export type ReportData =
  | { type: "revenue"; data: RevenueReportData }
  | { type: "client-revenue"; data: ClientRevenueRow[] }
  | { type: "project-profitability"; data: ProjectProfitabilityRow[] }
  | { type: "pending-payments"; data: PendingPaymentsData }

export async function getReportData(
  type: ReportType,
  organizationId?: string
): Promise<ReportData> {
  const orgId = organizationId ?? ORG_ID

  switch (type) {
    case "revenue": {
      const stats = await getDashboardStats(orgId)
      return {
        type,
        data: {
          totalRevenue: stats.revenue,
          pendingPayments: stats.pendingPayments,
          overduePayments: stats.overduePayments,
          revenueSeries: stats.revenueSeries,
          paymentTrend: stats.paymentTrend,
        },
      }
    }

    case "client-revenue": {
      const [clients, payments, projects] = await Promise.all([
        listClients({ organizationId: orgId }),
        listPayments({ organizationId: orgId, status: "verified" }),
        listProjects({ organizationId: orgId }),
      ])

      const rows: ClientRevenueRow[] = clients.map((client) => {
        const clientPayments = payments.filter((p) => p.client_id === client.id)
        const clientProjects = projects.filter((p) => p.client_id === client.id)
        return {
          clientId: client.id,
          clientName: client.company_name,
          revenue: clientPayments.reduce((sum, p) => sum + p.amount, 0),
          paymentCount: clientPayments.length,
          projectCount: clientProjects.length,
        }
      })

      return { type, data: rows.sort((a, b) => b.revenue - a.revenue) }
    }

    case "project-profitability": {
      const [projects, payments] = await Promise.all([
        listProjects({ organizationId: orgId }),
        listPayments({ organizationId: orgId, status: "verified" }),
      ])

      const rows: ProjectProfitabilityRow[] = projects.map((project) => {
        const collected = payments
          .filter((p) => p.project_id === project.id)
          .reduce((sum, p) => sum + p.amount, 0)
        const margin = collected - project.budget
        const marginPercent =
          project.budget > 0 ? Math.round((margin / project.budget) * 100) : 0
        return {
          projectId: project.id,
          projectName: project.name,
          budget: project.budget,
          collected,
          margin,
          marginPercent,
        }
      })

      return { type, data: rows.sort((a, b) => b.collected - a.collected) }
    }

    case "pending-payments": {
      const [stats, awaitingVerification, payments] = await Promise.all([
        getDashboardStats(orgId),
        listPaymentsAwaitingVerification(orgId),
        listPayments({
          organizationId: orgId,
          status: ["pending", "client_marked_paid", "under_review"],
        }),
      ])
      return {
        type,
        data: {
          pendingTotal: stats.pendingPayments,
          overdueTotal: stats.overduePayments,
          awaitingVerification,
          payments,
        },
      }
    }

    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown report type: ${_exhaustive}`)
    }
  }
}
