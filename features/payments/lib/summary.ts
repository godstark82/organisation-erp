import type { Payment } from "@/types"

export function summarizePayments(payments: Payment[]) {
  const verified = payments.filter((p) => p.status === "verified")
  const pending = payments.filter((p) =>
    ["pending", "client_marked_paid", "under_review"].includes(p.status)
  )
  const disputed = payments.filter((p) => p.status === "disputed")

  return {
    totalCount: payments.length,
    verifiedAmount: verified.reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
    disputedAmount: disputed.reduce((sum, p) => sum + p.amount, 0),
    verifiedCount: verified.length,
    pendingCount: pending.length,
    disputedCount: disputed.length,
    lastPaidAt:
      verified
        .map((p) => p.paid_at ?? p.verified_at)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
  }
}
