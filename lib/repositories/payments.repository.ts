import {
  addDemoActivityLog,
  enrichDispute,
  enrichPayment,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { canVerifyPayments } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"
import type {
  AppRole,
  Payment,
  PaymentDispute,
  PaymentDisputeMessage,
  PaymentProof,
  PaymentStatus,
  SessionUser,
} from "@/types"

export interface PaymentFilters {
  organizationId?: string
  clientId?: string
  projectId?: string
  status?: PaymentStatus | PaymentStatus[]
  search?: string
  sortBy?: "created_at" | "amount" | "updated_at" | "paid_at"
  sortOrder?: "asc" | "desc"
}

export type CreatePaymentInput = {
  organization_id: string
  project_id: string
  client_id: string
  amount: number
  currency?: string
  status?: PaymentStatus
  transaction_id?: string | null
  utr?: string | null
  notes?: string | null
  paid_at?: string | null
  created_by?: string | null
  invoice_id?: string | null
}

export type UpdatePaymentInput = Partial<
  Omit<CreatePaymentInput, "organization_id" | "created_by">
>

function filterPayments(
  payments: Payment[],
  filters?: PaymentFilters
): Payment[] {
  let result = payments.map(enrichPayment)
  const orgId = filters?.organizationId ?? ORG_ID

  result = result.filter((p) => p.organization_id === orgId)

  if (filters?.clientId) result = result.filter((p) => p.client_id === filters.clientId)
  if (filters?.projectId) result = result.filter((p) => p.project_id === filters.projectId)
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    result = result.filter((p) => statuses.includes(p.status))
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        (p.utr?.toLowerCase().includes(q) ?? false) ||
        (p.transaction_id?.toLowerCase().includes(q) ?? false) ||
        (p.notes?.toLowerCase().includes(q) ?? false) ||
        (p.project?.name?.toLowerCase().includes(q) ?? false) ||
        (p.client?.company_name?.toLowerCase().includes(q) ?? false)
    )
  }

  const sortBy = filters?.sortBy ?? "created_at"
  const sortOrder = filters?.sortOrder ?? "desc"
  result.sort((a, b) => {
    if (sortBy === "amount") {
      const cmp = a.amount - b.amount
      return sortOrder === "asc" ? cmp : -cmp
    }
    const av = a[sortBy] ?? ""
    const bv = b[sortBy] ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sortOrder === "asc" ? cmp : -cmp
  })

  return result
}

function assertClientPaymentUpdate(role: AppRole, status: PaymentStatus) {
  if (role !== "client") return
  if (status !== "client_marked_paid") {
    throw new Error("Clients may only mark payments as client_marked_paid")
  }
}

function assertVerifyPermission(role: AppRole, status: PaymentStatus) {
  if (status === "verified" || status === "rejected" || status === "under_review") {
    if (!canVerifyPayments(role)) {
      throw new Error("Insufficient permissions to verify or reject payments")
    }
  }
}

const PAYMENT_SELECT =
  "*, client:clients(*), project:projects(*), proofs:payment_proofs(*)"

export async function listPayments(
  filters?: PaymentFilters
): Promise<Payment[]> {
  if (isDemoMode()) {
    return filterPayments(getDemoStore().payments, filters)
  }

  const supabase = await createClient()
  let query = supabase.from("payments").select(PAYMENT_SELECT)

  if (filters?.organizationId) query = query.eq("organization_id", filters.organizationId)
  if (filters?.clientId) query = query.eq("client_id", filters.clientId)
  if (filters?.projectId) query = query.eq("project_id", filters.projectId)
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    query = query.in("status", statuses)
  }

  const sortBy = filters?.sortBy ?? "created_at"
  const ascending = (filters?.sortOrder ?? "desc") === "asc"
  query = query.order(sortBy, { ascending, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Payment[]
}

export async function getPayment(id: string): Promise<Payment | null> {
  if (isDemoMode()) {
    const payment = getDemoStore().payments.find((p) => p.id === id)
    return payment ? enrichPayment(payment) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("id", id)
    .single()

  if (error) return null
  return data as Payment
}

export async function createPayment(
  input: CreatePaymentInput,
  actorId?: string | null
): Promise<Payment> {
  const status = input.status ?? "pending"
  const paidAt =
    input.paid_at ??
    (status === "verified" ? new Date().toISOString() : null)

  if (isDemoMode()) {
    const now = touch()
    const payment: Payment = {
      id: generateDemoId(),
      organization_id: input.organization_id,
      invoice_id: input.invoice_id ?? null,
      client_id: input.client_id,
      project_id: input.project_id,
      amount: input.amount,
      currency: input.currency ?? "INR",
      status,
      transaction_id: input.transaction_id ?? null,
      utr: input.utr ?? null,
      notes: input.notes ?? null,
      paid_at: paidAt,
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      created_by: input.created_by ?? actorId ?? null,
      created_at: now,
      updated_at: now,
    }
    getDemoStore().payments.push(payment)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.created_by ?? null,
      action: "created",
      entity_type: "payment",
      entity_id: payment.id,
      entity_label: String(payment.amount),
      metadata: { project_id: payment.project_id },
    })
    return enrichPayment(payment)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .insert({
      organization_id: input.organization_id,
      invoice_id: input.invoice_id ?? null,
      client_id: input.client_id,
      project_id: input.project_id,
      amount: input.amount,
      currency: input.currency ?? "INR",
      status,
      transaction_id: input.transaction_id ?? null,
      utr: input.utr ?? null,
      notes: input.notes ?? null,
      paid_at: paidAt,
      created_by: input.created_by ?? actorId ?? null,
    })
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return data as Payment
}

export async function updatePayment(
  id: string,
  input: UpdatePaymentInput
): Promise<Payment | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.payments.findIndex((p) => p.id === id)
    if (idx === -1) return null

    const prev = store.payments[idx]
    const now = touch()
    const status = input.status ?? prev.status
    const updated: Payment = {
      ...prev,
      ...input,
      status,
      paid_at:
        input.paid_at !== undefined
          ? input.paid_at
          : status === "verified" && !prev.paid_at
            ? now
            : prev.paid_at,
      currency: input.currency ?? prev.currency,
      updated_at: now,
    }
    store.payments[idx] = updated
    return enrichPayment(updated)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return data as Payment
}

export async function deletePayment(id: string): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.payments.findIndex((p) => p.id === id)
    if (idx === -1) return false
    store.payments.splice(idx, 1)
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("payments").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  session: SessionUser,
  extra?: {
    utr?: string
    transaction_id?: string
    notes?: string
    rejection_reason?: string
  }
): Promise<Payment | null> {
  const role = session.profile.role

  if (role === "client") {
    assertClientPaymentUpdate(role, status)
  } else {
    assertVerifyPermission(role, status)
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.payments.findIndex((p) => p.id === id)
    if (idx === -1) return null

    const prev = store.payments[idx]
    const now = touch()
    const updated: Payment = {
      ...prev,
      status,
      utr: extra?.utr ?? prev.utr,
      transaction_id: extra?.transaction_id ?? prev.transaction_id,
      notes: extra?.notes ?? prev.notes,
      rejection_reason: extra?.rejection_reason ?? prev.rejection_reason,
      verified_by:
        status === "verified" || status === "rejected"
          ? session.id
          : prev.verified_by,
      verified_at:
        status === "verified" || status === "rejected" ? now : prev.verified_at,
      paid_at:
        status === "verified" ? (prev.paid_at ?? now) : prev.paid_at,
      updated_at: now,
    }
    store.payments[idx] = updated

    const action =
      status === "verified"
        ? "verified"
        : status === "rejected"
          ? "rejected"
          : status === "client_marked_paid"
            ? "paid"
            : "status_changed"

    addDemoActivityLog({
      organization_id: prev.organization_id,
      actor_id: session.id,
      action,
      entity_type: "payment",
      entity_id: id,
      entity_label: prev.project?.name ?? String(prev.amount),
      metadata: { from: prev.status, to: status },
    })

    return enrichPayment(updated)
  }

  const supabase = await createClient()
  const update: Partial<Payment> = {
    status,
    ...extra,
    updated_at: new Date().toISOString(),
  }
  if (status === "verified" || status === "rejected") {
    update.verified_by = session.id
    update.verified_at = new Date().toISOString()
  }
  if (status === "verified") {
    update.paid_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("payments")
    .update(update)
    .eq("id", id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return data as Payment
}

export async function markPaidByClient(
  id: string,
  session: SessionUser,
  input: { utr?: string; transaction_id?: string; notes?: string }
): Promise<Payment | null> {
  return updatePaymentStatus(id, "client_marked_paid", session, input)
}

export async function verifyPayment(
  id: string,
  session: SessionUser
): Promise<Payment | null> {
  if (!canVerifyPayments(session.profile.role)) {
    throw new Error("Insufficient permissions to verify payments")
  }
  return updatePaymentStatus(id, "verified", session)
}

export async function rejectPayment(
  id: string,
  session: SessionUser,
  reason: string
): Promise<Payment | null> {
  if (!canVerifyPayments(session.profile.role)) {
    throw new Error("Insufficient permissions to reject payments")
  }
  return updatePaymentStatus(id, "rejected", session, {
    rejection_reason: reason,
  })
}

export async function addPaymentProof(
  input: Omit<PaymentProof, "id" | "created_at">,
  actorId?: string | null
): Promise<PaymentProof> {
  if (isDemoMode()) {
    const proof: PaymentProof = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().paymentProofs.push(proof)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.uploaded_by,
      action: "uploaded",
      entity_type: "payment_proof",
      entity_id: proof.id,
      entity_label: proof.file_name,
      metadata: { payment_id: input.payment_id },
    })
    return proof
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_proofs")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as PaymentProof
}

export async function listDisputes(
  organizationId?: string
): Promise<PaymentDispute[]> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    return getDemoStore()
      .paymentDisputes.filter((d) => d.organization_id === orgId)
      .map(enrichDispute)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_disputes")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as PaymentDispute[]
}

export async function getDispute(id: string): Promise<PaymentDispute | null> {
  if (isDemoMode()) {
    const dispute = getDemoStore().paymentDisputes.find((d) => d.id === id)
    return dispute ? enrichDispute(dispute) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_disputes")
    .select("*, messages:payment_dispute_messages(*, author:profiles(*))")
    .eq("id", id)
    .single()

  if (error) return null
  return data as PaymentDispute
}

export async function createDispute(
  input: Omit<PaymentDispute, "id" | "created_at" | "updated_at" | "resolved_at">,
  session: SessionUser
): Promise<PaymentDispute> {
  if (isDemoMode()) {
    const now = touch()
    const dispute: PaymentDispute = {
      id: generateDemoId(),
      ...input,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    }
    getDemoStore().paymentDisputes.push(dispute)

    const paymentIdx = getDemoStore().payments.findIndex(
      (p) => p.id === input.payment_id
    )
    if (paymentIdx !== -1) {
      getDemoStore().payments[paymentIdx].status = "disputed"
      getDemoStore().payments[paymentIdx].updated_at = now
    }

    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: session.id,
      action: "disputed",
      entity_type: "dispute",
      entity_id: dispute.id,
      entity_label: input.reason.slice(0, 80),
      metadata: {},
    })
    return enrichDispute(dispute)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_disputes")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as PaymentDispute
}

export async function addDisputeMessage(
  input: Omit<PaymentDisputeMessage, "id" | "created_at">,
  actorId?: string | null
): Promise<PaymentDisputeMessage> {
  if (isDemoMode()) {
    const message: PaymentDisputeMessage = {
      id: generateDemoId(),
      ...input,
      created_at: touch(),
    }
    getDemoStore().paymentDisputeMessages.push(message)

    const disputeIdx = getDemoStore().paymentDisputes.findIndex(
      (d) => d.id === input.dispute_id
    )
    if (disputeIdx !== -1) {
      getDemoStore().paymentDisputes[disputeIdx].updated_at = touch()
    }

    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.author_id,
      action: "commented",
      entity_type: "dispute",
      entity_id: input.dispute_id,
      entity_label: null,
      metadata: {},
    })
    return message
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payment_dispute_messages")
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as PaymentDisputeMessage
}

export async function listPaymentsAwaitingVerification(
  organizationId?: string
): Promise<Payment[]> {
  return listPayments({
    organizationId,
    status: ["client_marked_paid", "under_review", "pending"],
  })
}
