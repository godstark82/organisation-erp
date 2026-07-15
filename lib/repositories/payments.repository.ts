import {
  addDemoActivityLog,
  enrichDispute,
  enrichPayment,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { canAcceptPaymentsAsStaffRole } from "@/lib/rbac"
import { PAYMENTS_PAGE_SIZE } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { isProjectMember } from "@/lib/repositories/projects.repository"
import type {
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
  /** Inclusive YYYY-MM-DD, matches paid_at ?? created_at */
  dateFrom?: string
  /** Inclusive YYYY-MM-DD, matches paid_at ?? created_at */
  dateTo?: string
  sortBy?: "created_at" | "amount" | "updated_at" | "paid_at"
  sortOrder?: "asc" | "desc"
  /** Max 100 when paginating via listPaymentsPage */
  limit?: number
  offset?: number
}

export type PaymentsPageResult = {
  items: Payment[]
  total: number
}

export type CreatePaymentInput = {
  organization_id: string
  project_id: string
  client_id: string
  amount: number
  currency?: string
  /** Ignored on create — always pending until both sides accept */
  status?: PaymentStatus
  transaction_id?: string | null
  utr?: string | null
  notes?: string | null
  paid_at?: string | null
  created_by?: string | null
  invoice_id?: string | null
  /** Which side the creator represents */
  created_by_side?: "client" | "staff"
}

export type UpdatePaymentInput = Partial<
  Omit<CreatePaymentInput, "organization_id" | "created_by" | "created_by_side" | "status">
>

function paymentEffectiveDateKey(payment: Payment): string {
  const raw = payment.paid_at ?? payment.created_at
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return "unknown"
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

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
  if (filters?.dateFrom || filters?.dateTo) {
    result = result.filter((p) => {
      const key = paymentEffectiveDateKey(p)
      if (key === "unknown") return false
      if (filters.dateFrom && key < filters.dateFrom) return false
      if (filters.dateTo && key > filters.dateTo) return false
      return true
    })
  }

  const sortBy = filters?.sortBy ?? "created_at"
  const sortOrder = filters?.sortOrder ?? "desc"
  result.sort((a, b) => {
    if (sortBy === "amount") {
      const cmp = a.amount - b.amount
      return sortOrder === "asc" ? cmp : -cmp
    }
    if (sortBy === "paid_at") {
      const av = a.paid_at ?? a.created_at ?? ""
      const bv = b.paid_at ?? b.created_at ?? ""
      const cmp = String(av).localeCompare(String(bv))
      return sortOrder === "asc" ? cmp : -cmp
    }
    const av = a[sortBy] ?? ""
    const bv = b[sortBy] ?? ""
    const cmp = String(av).localeCompare(String(bv))
    return sortOrder === "asc" ? cmp : -cmp
  })

  return result
}

async function assertCanAcceptAsStaff(
  session: SessionUser,
  projectId: string
): Promise<void> {
  const role = session.profile.role
  if (role === "super_admin" || role === "manager" || role === "accountant") {
    return
  }
  if (role === "developer" && (await isProjectMember(projectId, session.id))) {
    return
  }
  throw new Error(
    "Only a project developer, manager, or super admin can accept for the team"
  )
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
  if (filters?.search) {
    const q = filters.search.replace(/[%_,]/g, "")
    if (q) {
      query = query.or(
        `utr.ilike.%${q}%,transaction_id.ilike.%${q}%,notes.ilike.%${q}%`
      )
    }
  }
  if (filters?.dateFrom || filters?.dateTo) {
    const from = filters.dateFrom ?? null
    const to = filters.dateTo ?? null
    const parts: string[] = []
    if (from && to) {
      parts.push(
        `and(paid_at.gte.${from},paid_at.lte.${to})`,
        `and(paid_at.is.null,created_at.gte.${from},created_at.lte.${to})`
      )
    } else if (from) {
      parts.push(
        `paid_at.gte.${from}`,
        `and(paid_at.is.null,created_at.gte.${from})`
      )
    } else if (to) {
      parts.push(
        `paid_at.lte.${to}`,
        `and(paid_at.is.null,created_at.lte.${to})`
      )
    }
    if (parts.length) query = query.or(parts.join(","))
  }

  const sortBy = filters?.sortBy ?? "created_at"
  const ascending = (filters?.sortOrder ?? "desc") === "asc"
  if (sortBy === "paid_at") {
    query = query
      .order("paid_at", { ascending, nullsFirst: false })
      .order("created_at", { ascending, nullsFirst: false })
  } else {
    query = query.order(sortBy, { ascending, nullsFirst: false })
  }

  if (filters?.limit != null) {
    const limit = Math.min(Math.max(1, filters.limit), PAYMENTS_PAGE_SIZE)
    const offset = Math.max(0, filters.offset ?? 0)
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Payment[]
}

export async function listPaymentsPage(
  filters?: PaymentFilters
): Promise<PaymentsPageResult> {
  const limit = Math.min(
    Math.max(1, filters?.limit ?? PAYMENTS_PAGE_SIZE),
    PAYMENTS_PAGE_SIZE
  )
  const offset = Math.max(0, filters?.offset ?? 0)
  const pageFilters: PaymentFilters = {
    ...filters,
    limit,
    offset,
    sortBy: filters?.sortBy ?? "paid_at",
    sortOrder: filters?.sortOrder ?? "desc",
  }

  if (isDemoMode()) {
    const all = filterPayments(getDemoStore().payments, {
      ...pageFilters,
      limit: undefined,
      offset: undefined,
    })
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
    }
  }

  const supabase = await createClient()
  let query = supabase
    .from("payments")
    .select(PAYMENT_SELECT, { count: "exact" })

  if (pageFilters.organizationId) {
    query = query.eq("organization_id", pageFilters.organizationId)
  }
  if (pageFilters.clientId) query = query.eq("client_id", pageFilters.clientId)
  if (pageFilters.projectId) query = query.eq("project_id", pageFilters.projectId)
  if (pageFilters.status) {
    const statuses = Array.isArray(pageFilters.status)
      ? pageFilters.status
      : [pageFilters.status]
    query = query.in("status", statuses)
  }
  if (pageFilters.search) {
    const q = pageFilters.search.replace(/[%_,]/g, "")
    if (q) {
      query = query.or(
        `utr.ilike.%${q}%,transaction_id.ilike.%${q}%,notes.ilike.%${q}%`
      )
    }
  }
  if (pageFilters.dateFrom || pageFilters.dateTo) {
    const from = pageFilters.dateFrom ?? null
    const to = pageFilters.dateTo ?? null
    const parts: string[] = []
    if (from && to) {
      parts.push(
        `and(paid_at.gte.${from},paid_at.lte.${to})`,
        `and(paid_at.is.null,created_at.gte.${from},created_at.lte.${to})`
      )
    } else if (from) {
      parts.push(
        `paid_at.gte.${from}`,
        `and(paid_at.is.null,created_at.gte.${from})`
      )
    } else if (to) {
      parts.push(
        `paid_at.lte.${to}`,
        `and(paid_at.is.null,created_at.lte.${to})`
      )
    }
    if (parts.length) query = query.or(parts.join(","))
  }

  const ascending = (pageFilters.sortOrder ?? "desc") === "asc"
  const sortBy = pageFilters.sortBy ?? "paid_at"
  if (sortBy === "paid_at") {
    query = query
      .order("paid_at", { ascending, nullsFirst: false })
      .order("created_at", { ascending, nullsFirst: false })
  } else {
    query = query.order(sortBy, { ascending, nullsFirst: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw error
  return {
    items: (data ?? []) as Payment[],
    total: count ?? 0,
  }
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
  const nowIso = new Date().toISOString()
  const side = input.created_by_side ?? "staff"
  const clientAcceptedAt = side === "client" ? nowIso : null
  const staffAcceptedAt = side === "staff" ? nowIso : null
  const acceptorId = input.created_by ?? actorId ?? null

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
      status: "pending",
      transaction_id: input.transaction_id ?? null,
      utr: input.utr ?? null,
      notes: input.notes ?? null,
      paid_at: input.paid_at ?? null,
      verified_by: null,
      verified_at: null,
      rejection_reason: null,
      client_accepted_at: clientAcceptedAt,
      client_accepted_by: side === "client" ? acceptorId : null,
      staff_accepted_at: staffAcceptedAt,
      staff_accepted_by: side === "staff" ? acceptorId : null,
      created_by: acceptorId,
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
      metadata: { project_id: payment.project_id, side },
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
      status: "pending",
      transaction_id: input.transaction_id ?? null,
      utr: input.utr ?? null,
      notes: input.notes ?? null,
      paid_at: input.paid_at ?? null,
      created_by: acceptorId,
      client_accepted_at: clientAcceptedAt,
      client_accepted_by: side === "client" ? acceptorId : null,
      staff_accepted_at: staffAcceptedAt,
      staff_accepted_by: side === "staff" ? acceptorId : null,
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
    const updated: Payment = {
      ...prev,
      ...input,
      status: prev.status,
      paid_at: input.paid_at !== undefined ? input.paid_at : prev.paid_at,
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
  if (status === "rejected") {
    return rejectPayment(id, session, extra?.rejection_reason ?? "Rejected")
  }
  if (status === "verified") {
    return acceptPayment(id, session, extra)
  }
  // Legacy paths — prefer acceptPayment
  return acceptPayment(id, session, extra)
}

export async function acceptPayment(
  id: string,
  session: SessionUser,
  extra?: {
    utr?: string
    transaction_id?: string
    notes?: string
  }
): Promise<Payment | null> {
  const payment = await getPayment(id)
  if (!payment) return null

  if (payment.status === "verified") {
    throw new Error("Payment is already verified")
  }
  if (payment.status === "disputed") {
    throw new Error("Resolve the dispute before accepting this payment")
  }

  const role = session.profile.role
  const isClient = role === "client"
  const now = new Date().toISOString()

  let clientAcceptedAt = payment.client_accepted_at
  let clientAcceptedBy = payment.client_accepted_by
  let staffAcceptedAt = payment.staff_accepted_at
  let staffAcceptedBy = payment.staff_accepted_by

  // Legacy flags
  if (
    !clientAcceptedAt &&
    (payment.status === "client_marked_paid" || payment.status === "under_review")
  ) {
    clientAcceptedAt = payment.paid_at ?? payment.updated_at
    clientAcceptedBy = payment.created_by
  }

  if (isClient) {
    if (clientAcceptedAt && payment.status !== "rejected") {
      throw new Error("You have already accepted this payment")
    }
    clientAcceptedAt = now
    clientAcceptedBy = session.id
  } else {
    if (!canAcceptPaymentsAsStaffRole(role)) {
      throw new Error("You cannot accept payments for the team")
    }
    await assertCanAcceptAsStaff(session, payment.project_id)
    if (staffAcceptedAt && payment.status !== "rejected") {
      throw new Error("The team has already accepted this payment")
    }
    staffAcceptedAt = now
    staffAcceptedBy = session.id
  }

  const bothAccepted = Boolean(clientAcceptedAt && staffAcceptedAt)
  const nextStatus: PaymentStatus = bothAccepted ? "verified" : "pending"

  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.payments.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const prev = store.payments[idx]
    const touched = touch()
    const updated: Payment = {
      ...prev,
      status: nextStatus,
      utr: extra?.utr ?? prev.utr,
      transaction_id: extra?.transaction_id ?? prev.transaction_id,
      notes: extra?.notes ?? prev.notes,
      rejection_reason: bothAccepted ? null : prev.rejection_reason,
      client_accepted_at: clientAcceptedAt,
      client_accepted_by: clientAcceptedBy,
      staff_accepted_at: staffAcceptedAt,
      staff_accepted_by: staffAcceptedBy,
      verified_by: bothAccepted ? session.id : null,
      verified_at: bothAccepted ? touched : null,
      paid_at: bothAccepted ? (prev.paid_at ?? touched) : prev.paid_at,
      updated_at: touched,
    }
    store.payments[idx] = updated
    addDemoActivityLog({
      organization_id: prev.organization_id,
      actor_id: session.id,
      action: bothAccepted ? "verified" : "status_changed",
      entity_type: "payment",
      entity_id: id,
      entity_label: prev.project?.name ?? String(prev.amount),
      metadata: {
        side: isClient ? "client" : "staff",
        from: prev.status,
        to: nextStatus,
      },
    })
    return enrichPayment(updated)
  }

  const supabase = await createClient()
  const update: Record<string, unknown> = {
    status: nextStatus,
    client_accepted_at: clientAcceptedAt,
    client_accepted_by: clientAcceptedBy,
    staff_accepted_at: staffAcceptedAt,
    staff_accepted_by: staffAcceptedBy,
    updated_at: now,
    ...extra,
  }
  if (bothAccepted) {
    update.verified_by = session.id
    update.verified_at = now
    update.paid_at = payment.paid_at ?? now
    update.rejection_reason = null
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
  return acceptPayment(id, session, input)
}

export async function verifyPayment(
  id: string,
  session: SessionUser
): Promise<Payment | null> {
  return acceptPayment(id, session)
}

export async function rejectPayment(
  id: string,
  session: SessionUser,
  reason: string
): Promise<Payment | null> {
  const payment = await getPayment(id)
  if (!payment) return null

  if (session.profile.role === "client") {
    throw new Error("Clients cannot reject payments")
  }
  await assertCanAcceptAsStaff(session, payment.project_id)

  const now = new Date().toISOString()

  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.payments.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const prev = store.payments[idx]
    const touched = touch()
    const updated: Payment = {
      ...prev,
      status: "rejected",
      rejection_reason: reason,
      verified_by: session.id,
      verified_at: touched,
      // Reset acceptance so both sides must re-confirm
      client_accepted_at: null,
      client_accepted_by: null,
      staff_accepted_at: null,
      staff_accepted_by: null,
      updated_at: touched,
    }
    store.payments[idx] = updated
    addDemoActivityLog({
      organization_id: prev.organization_id,
      actor_id: session.id,
      action: "rejected",
      entity_type: "payment",
      entity_id: id,
      entity_label: prev.project?.name ?? String(prev.amount),
      metadata: { reason },
    })
    return enrichPayment(updated)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "rejected",
      rejection_reason: reason,
      verified_by: session.id,
      verified_at: now,
      client_accepted_at: null,
      client_accepted_by: null,
      staff_accepted_at: null,
      staff_accepted_by: null,
      updated_at: now,
    })
    .eq("id", id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return data as Payment
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
    status: "pending",
  })
}

/** Lightweight rows for aggregating paid / pending per project. */
export async function listPaymentAmounts(
  organizationId?: string
): Promise<Pick<Payment, "project_id" | "amount" | "status">[]> {
  const orgId = organizationId ?? ORG_ID

  if (isDemoMode()) {
    return getDemoStore()
      .payments.filter((p) => p.organization_id === orgId)
      .map((p) => ({
        project_id: p.project_id,
        amount: p.amount,
        status: p.status,
      }))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payments")
    .select("project_id, amount, status")
    .eq("organization_id", orgId)

  if (error) throw error
  return (data ?? []) as Pick<Payment, "project_id" | "amount" | "status">[]
}
