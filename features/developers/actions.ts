"use server"

import { revalidatePath } from "next/cache"
import {
  createDeveloperSchema,
  updateDeveloperSchema,
} from "@/features/developers/schemas"
import { requirePermission } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  createDeveloper,
  deactivateDeveloper,
  updateDeveloper,
} from "@/lib/repositories/profiles.repository"

export type DeveloperActionState = {
  error?: string
  success?: string
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

export async function createDeveloperAction(
  _prev: DeveloperActionState | null,
  formData: FormData
): Promise<DeveloperActionState> {
  const session = await requirePermission("users.manage")
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  const parsed = createDeveloperSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    title: formData.get("title"),
    role: formData.get("role") || "developer",
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  try {
    await createDeveloper(
      {
        organization_id: orgId,
        email: parsed.data.email,
        full_name: parsed.data.full_name,
        phone: emptyToNull(parsed.data.phone),
        title: emptyToNull(parsed.data.title),
        role: parsed.data.role,
        password: parsed.data.password,
      },
      session.id
    )

    revalidatePath("/developers")
    revalidatePath("/projects")
    return { success: "Developer added" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create developer",
    }
  }
}

export async function updateDeveloperAction(
  developerId: string,
  _prev: DeveloperActionState | null,
  formData: FormData
): Promise<DeveloperActionState> {
  await requirePermission("users.manage")

  const parsed = updateDeveloperSchema.safeParse({
    full_name: formData.get("full_name") || undefined,
    phone: formData.get("phone"),
    title: formData.get("title"),
    role: formData.get("role") || undefined,
    is_active: formData.get("is_active") === "true",
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  try {
    const updated = await updateDeveloper(developerId, {
      full_name: parsed.data.full_name,
      phone: emptyToNull(parsed.data.phone),
      title: emptyToNull(parsed.data.title),
      role: parsed.data.role,
      is_active: parsed.data.is_active,
    })

    if (!updated) return { error: "Developer not found" }

    revalidatePath("/developers")
    revalidatePath("/projects")
    return { success: "Developer updated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update developer",
    }
  }
}

export async function deactivateDeveloperAction(
  developerId: string
): Promise<DeveloperActionState> {
  await requirePermission("users.manage")

  try {
    const ok = await deactivateDeveloper(developerId)
    if (!ok) return { error: "Developer not found" }
    revalidatePath("/developers")
    revalidatePath("/projects")
    return { success: "Developer deactivated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to deactivate developer",
    }
  }
}
