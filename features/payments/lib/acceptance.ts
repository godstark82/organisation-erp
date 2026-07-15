import type { Payment } from "@/types"

export function hasClientAccepted(payment: Payment): boolean {
  if (payment.client_accepted_at) return true
  // Legacy statuses before dual-acceptance columns
  return (
    payment.status === "client_marked_paid" ||
    payment.status === "under_review" ||
    payment.status === "verified"
  )
}

export function hasStaffAccepted(payment: Payment): boolean {
  if (payment.staff_accepted_at) return true
  return payment.status === "verified"
}

export function isPaymentVerified(payment: Payment): boolean {
  return payment.status === "verified"
}

export function isAwaitingAcceptance(payment: Payment): boolean {
  if (payment.status === "verified" || payment.status === "disputed") return false
  if (payment.status === "rejected") {
    return !hasClientAccepted(payment) || !hasStaffAccepted(payment)
  }
  return !hasClientAccepted(payment) || !hasStaffAccepted(payment)
}

export function needsClientAcceptance(payment: Payment): boolean {
  if (payment.status === "verified" || payment.status === "disputed") return false
  return !hasClientAccepted(payment) || payment.status === "rejected"
}

export function needsStaffAcceptance(payment: Payment): boolean {
  if (payment.status === "verified" || payment.status === "disputed") return false
  if (payment.status === "rejected") return true
  return !hasStaffAccepted(payment)
}

export function displayPaymentStatus(payment: Payment): {
  status: Payment["status"]
  label: string
} {
  if (payment.status === "verified") {
    return { status: "verified", label: "Verified" }
  }
  if (payment.status === "rejected") {
    return { status: "rejected", label: "Rejected" }
  }
  if (payment.status === "disputed") {
    return { status: "disputed", label: "Disputed" }
  }
  if (hasClientAccepted(payment) && !hasStaffAccepted(payment)) {
    return { status: "pending", label: "Awaiting team" }
  }
  if (hasStaffAccepted(payment) && !hasClientAccepted(payment)) {
    return { status: "pending", label: "Awaiting client" }
  }
  return { status: "pending", label: "Awaiting acceptance" }
}
