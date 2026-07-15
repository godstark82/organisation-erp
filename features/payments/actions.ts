"use server"

import { revalidatePath } from "next/cache"
import { requirePermission, requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  addDisputeMessage,
  addPaymentProof,
  createDispute,
  createPayment,
  deletePayment,
  getDispute,
  getPayment,
  markPaidByClient,
  rejectPayment,
  updatePayment,
  updatePaymentStatus,
  verifyPayment,
} from "@/lib/repositories/payments.repository"
import { getProject } from "@/lib/repositories/projects.repository"
import { canVerifyPayments, hasPermission } from "@/lib/rbac"
import type { PaymentDisputeMessage } from "@/types"
import {
  createPaymentSchema,
  markPaidSchema,
  raiseDisputeSchema,
  rejectPaymentSchema,
  replyDisputeSchema,
  updatePaymentSchema,
} from "./schemas"

export type PaymentActionState = {
  error?: string
  success?: string
  paymentId?: string
  fieldErrors?: Record<string, string[]>
}

function fieldErrorsFromZod(
  error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }
): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors
  return Object.fromEntries(
    Object.entries(flattened)
      .filter(([, value]) => value && value.length > 0)
      .map(([key, value]) => [key, value as string[]])
  )
}

function orgIdFromSession(session: Awaited<ReturnType<typeof requireSession>>) {
  return session.profile.organization_id ?? ORG_ID
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  return `data:${file.type || "application/octet-stream"};base64,${base64}`
}

async function processProofFiles(
  formData: FormData,
  paymentId: string,
  orgId: string,
  userId: string
) {
  const files = formData.getAll("proofs") as File[]
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue
    const url = await fileToDataUrl(file)
    await addPaymentProof(
      {
        organization_id: orgId,
        payment_id: paymentId,
        file_name: file.name,
        file_url: url,
        file_type: file.type || null,
        file_size: file.size,
        uploaded_by: userId,
      },
      userId
    )
  }
}

export async function createPaymentAction(
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await requirePermission("payments.create")
  const orgId = orgIdFromSession(session)

  const parsed = createPaymentSchema.safeParse({
    project_id: formData.get("project_id"),
    client_id: formData.get("client_id") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency") || "INR",
    status: formData.get("status") || "pending",
    paid_at: formData.get("paid_at") || null,
    utr: formData.get("utr") || null,
    transaction_id: formData.get("transaction_id") || null,
    notes: formData.get("notes") || null,
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data
  const project = await getProject(data.project_id)
  if (!project) return { error: "Project not found" }

  const clientId = data.client_id || project.client_id
  if (!clientId) {
    return { error: "Select a client or assign one to the project first" }
  }

  try {
    const payment = await createPayment(
      {
        organization_id: orgId,
        project_id: data.project_id,
        client_id: clientId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paid_at: data.paid_at || null,
        utr: data.utr,
        transaction_id: data.transaction_id,
        notes: data.notes,
        created_by: session.id,
        invoice_id: null,
      },
      session.id
    )

    revalidatePath("/payments")
    revalidatePath(`/projects/${data.project_id}`)
    revalidatePath(`/projects/${data.project_id}/payments`)
    revalidatePath("/dashboard")
    return { success: "Payment recorded", paymentId: payment.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create payment",
    }
  }
}

export async function updatePaymentAction(
  paymentId: string,
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  await requirePermission("payments.create")

  const parsed = updatePaymentSchema.safeParse({
    id: paymentId,
    project_id: formData.get("project_id") || undefined,
    client_id: formData.get("client_id") || undefined,
    amount: formData.get("amount") || undefined,
    currency: formData.get("currency") || undefined,
    status: formData.get("status") || undefined,
    paid_at: formData.get("paid_at") || null,
    utr: formData.get("utr") || null,
    transaction_id: formData.get("transaction_id") || null,
    notes: formData.get("notes") || null,
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const { id: _id, ...data } = parsed.data

  try {
    const updated = await updatePayment(paymentId, {
      ...data,
      client_id: data.client_id || undefined,
    })
    if (!updated) return { error: "Payment not found" }

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    if (updated.project_id) {
      revalidatePath(`/projects/${updated.project_id}`)
      revalidatePath(`/projects/${updated.project_id}/payments`)
    }
    return { success: "Payment updated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update payment",
    }
  }
}

export async function deletePaymentAction(
  paymentId: string
): Promise<PaymentActionState> {
  try {
    await requirePermission("payments.create")
    const payment = await getPayment(paymentId)
    await deletePayment(paymentId)
    revalidatePath("/payments")
    if (payment?.project_id) {
      revalidatePath(`/projects/${payment.project_id}/payments`)
    }
    return { success: "Payment deleted" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete payment",
    }
  }
}

export async function markPaidAction(
  paymentId: string,
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await requireSession()

  const payment = await getPayment(paymentId)
  if (!payment) return { error: "Payment not found" }

  if (session.profile.role !== "client") {
    return { error: "Only clients can mark payments as paid" }
  }

  if (payment.status !== "pending" && payment.status !== "rejected") {
    return { error: "This payment cannot be marked as paid in its current state" }
  }

  const parsed = markPaidSchema.safeParse({
    utr: formData.get("utr"),
    transaction_id: formData.get("transaction_id"),
    notes: formData.get("notes"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const proofs = formData.getAll("proofs") as File[]
  const hasProof = proofs.some((f) => f instanceof File && f.size > 0)
  if (!hasProof && !parsed.data.utr?.trim() && !parsed.data.transaction_id?.trim()) {
    return { error: "Upload a payment proof or provide UTR / transaction ID" }
  }

  try {
    const orgId = orgIdFromSession(session)
    await markPaidByClient(paymentId, session, {
      utr: parsed.data.utr?.trim() || undefined,
      transaction_id: parsed.data.transaction_id?.trim() || undefined,
      notes: parsed.data.notes?.trim() || undefined,
    })

    await processProofFiles(formData, paymentId, orgId, session.id)

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    return { success: "Payment marked as paid. Awaiting admin verification." }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to mark payment as paid",
    }
  }
}

export async function reviewPaymentAction(
  paymentId: string
): Promise<PaymentActionState> {
  const session = await requirePermission("payments.verify")

  if (!canVerifyPayments(session.profile.role)) {
    return { error: "Insufficient permissions" }
  }

  try {
    const updated = await updatePaymentStatus(
      paymentId,
      "under_review",
      session
    )
    if (!updated) return { error: "Payment not found" }

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    return { success: "Payment moved to under review" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update payment",
    }
  }
}

export async function verifyPaymentAction(
  paymentId: string
): Promise<PaymentActionState> {
  const session = await requirePermission("payments.verify")

  try {
    const updated = await verifyPayment(paymentId, session)
    if (!updated) return { error: "Payment not found" }

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    return { success: "Payment verified successfully" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to verify payment",
    }
  }
}

export async function rejectPaymentAction(
  paymentId: string,
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await requirePermission("payments.verify")

  const parsed = rejectPaymentSchema.safeParse({
    rejection_reason: formData.get("rejection_reason"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  try {
    const updated = await rejectPayment(
      paymentId,
      session,
      parsed.data.rejection_reason
    )
    if (!updated) return { error: "Payment not found" }

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    return { success: "Payment rejected" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reject payment",
    }
  }
}

export async function raiseDisputeAction(
  paymentId: string,
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await requireSession()

  if (
    !hasPermission(session.permissions, "payments.dispute") &&
    session.profile.role !== "client"
  ) {
    return { error: "You do not have permission to raise disputes" }
  }

  const parsed = raiseDisputeSchema.safeParse({
    reason: formData.get("reason"),
    expected_amount: formData.get("expected_amount"),
    received_amount: formData.get("received_amount"),
    message: formData.get("message"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const payment = await getPayment(paymentId)
  if (!payment) return { error: "Payment not found" }

  try {
    const orgId = orgIdFromSession(session)
    const dispute = await createDispute(
      {
        organization_id: orgId,
        payment_id: paymentId,
        invoice_id: payment.invoice_id,
        reason: parsed.data.reason,
        expected_amount: parsed.data.expected_amount ?? null,
        received_amount: parsed.data.received_amount ?? null,
        status: "open",
        raised_by: session.id,
      },
      session
    )

    const attachments: { name: string; url: string }[] = []
    const files = formData.getAll("attachments") as File[]
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue
      attachments.push({ name: file.name, url: await fileToDataUrl(file) })
    }

    await addDisputeMessage(
      {
        organization_id: orgId,
        dispute_id: dispute.id,
        author_id: session.id,
        message: parsed.data.message,
        attachments,
      },
      session.id
    )

    revalidatePath("/payments")
    revalidatePath(`/payments/${paymentId}`)
    return { success: "Dispute raised successfully" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to raise dispute",
    }
  }
}

export async function replyDisputeAction(
  disputeId: string,
  _prev: PaymentActionState | null,
  formData: FormData
): Promise<PaymentActionState> {
  const session = await requireSession()

  const parsed = replyDisputeSchema.safeParse({
    message: formData.get("message"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const dispute = await getDispute(disputeId)
  if (!dispute) return { error: "Dispute not found" }

  try {
    const orgId = orgIdFromSession(session)
    const attachments: { name: string; url: string }[] = []
    const files = formData.getAll("attachments") as File[]
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue
      attachments.push({ name: file.name, url: await fileToDataUrl(file) })
    }

    await addDisputeMessage(
      {
        organization_id: orgId,
        dispute_id: disputeId,
        author_id: session.id,
        message: parsed.data.message,
        attachments,
      },
      session.id
    )

    revalidatePath(`/payments/${dispute.payment_id}`)
    return { success: "Reply posted" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to post reply",
    }
  }
}

export async function getDisputeMessages(
  disputeId: string
): Promise<PaymentDisputeMessage[]> {
  const dispute = await getDispute(disputeId)
  return dispute?.messages ?? []
}
