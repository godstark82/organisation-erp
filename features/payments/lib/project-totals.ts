import type { Payment } from "@/types"

export type ProjectPaymentTotal = { paid: number; pending: number }

export function buildProjectPaymentTotals(
  payments: Pick<Payment, "project_id" | "amount" | "status">[]
): Record<string, ProjectPaymentTotal> {
  const totals: Record<string, ProjectPaymentTotal> = {}
  for (const payment of payments) {
    const entry = totals[payment.project_id] ?? { paid: 0, pending: 0 }
    if (payment.status === "verified") {
      entry.paid += payment.amount
    } else if (
      ["pending", "client_marked_paid", "under_review"].includes(payment.status)
    ) {
      entry.pending += payment.amount
    }
    totals[payment.project_id] = entry
  }
  return totals
}
