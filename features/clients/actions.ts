"use server"

import { revalidatePath } from "next/cache"
import { requirePermission, requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  createClientRecord,
  deleteClient,
  updateClient,
} from "@/lib/repositories/clients.repository"
import { hasPermission } from "@/lib/rbac"
import { clientFormSchema } from "./schemas"

export type ClientActionState = {
  error?: string
  success?: string
  id?: string
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

function emptyToNull(value: string | null | undefined) {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function createClientAction(
  _prev: ClientActionState | null,
  formData: FormData
): Promise<ClientActionState> {
  const session = await requirePermission("clients.create")

  const parsed = clientFormSchema.safeParse({
    company_name: formData.get("company_name"),
    client_name: formData.get("client_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    gst: formData.get("gst"),
    address: formData.get("address"),
    country: formData.get("country"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data
  const orgId = session.profile.organization_id ?? ORG_ID

  try {
    const client = await createClientRecord(
      {
        organization_id: orgId,
        company_name: data.company_name.trim(),
        client_name: data.client_name.trim(),
        email: data.email.trim(),
        phone: emptyToNull(data.phone),
        gst: emptyToNull(data.gst),
        address: emptyToNull(data.address),
        country: emptyToNull(data.country),
        notes: emptyToNull(data.notes),
        status: data.status,
        portal_user_id: null,
        created_by: session.id,
      },
      session.id
    )

    revalidatePath("/clients")
    revalidatePath(`/clients/${client.id}`)
    return { success: "Client created successfully", id: client.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create client",
    }
  }
}

export async function updateClientAction(
  clientId: string,
  _prev: ClientActionState | null,
  formData: FormData
): Promise<ClientActionState> {
  const session = await requirePermission("clients.update")

  const parsed = clientFormSchema.safeParse({
    company_name: formData.get("company_name"),
    client_name: formData.get("client_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    gst: formData.get("gst"),
    address: formData.get("address"),
    country: formData.get("country"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data

  try {
    const updated = await updateClient(
      clientId,
      {
        company_name: data.company_name.trim(),
        client_name: data.client_name.trim(),
        email: data.email.trim(),
        phone: emptyToNull(data.phone),
        gst: emptyToNull(data.gst),
        address: emptyToNull(data.address),
        country: emptyToNull(data.country),
        notes: emptyToNull(data.notes),
        status: data.status,
      },
      session.id
    )

    if (!updated) {
      return { error: "Client not found" }
    }

    revalidatePath("/clients")
    revalidatePath(`/clients/${clientId}`)
    return { success: "Client updated successfully" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update client",
    }
  }
}

export async function deleteClientAction(clientId: string): Promise<ClientActionState> {
  const session = await requireSession()

  if (!hasPermission(session.permissions, "clients.update")) {
    return { error: "You do not have permission to delete clients" }
  }

  try {
    const removed = await deleteClient(clientId, session.id)
    if (!removed) {
      return { error: "Client not found" }
    }

    revalidatePath("/clients")
    return { success: "Client deleted successfully", id: clientId }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete client",
    }
  }
}
