"use server"

import { revalidatePath } from "next/cache"
import {
  addProjectMembersSchema,
  createMilestoneSchema,
  createProjectSchema,
  projectCategorySchema,
  updateMilestoneSchema,
} from "@/features/projects/schemas"
import { requireSession } from "@/lib/auth/session"
import { ORG_ID } from "@/lib/data/demo-store"
import {
  addProjectMember,
  createMilestone,
  createProject,
  createProjectCategory,
  deleteProject,
  deleteProjectCategory,
  removeProjectMember,
  updateMilestone,
  updateMilestoneStatus,
  updateProject,
  updateProjectCategory,
} from "@/lib/repositories/projects.repository"

export type ProjectActionState = {
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

function actionErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    // Sometimes message is a JSON blob from PostgREST
    if (err.message.startsWith("{")) {
      try {
        const parsed = JSON.parse(err.message) as {
          message?: string
          details?: string
          hint?: string
        }
        return [parsed.message, parsed.details, parsed.hint]
          .filter(Boolean)
          .join(" — ")
      } catch {
        return err.message
      }
    }
    return err.message
  }
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export async function createProjectAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    client_id: formData.get("client_id") || undefined,
    description: formData.get("description") || undefined,
    category_id: formData.get("category_id") || undefined,
    priority: formData.get("priority"),
    budget: formData.get("budget"),
    status: formData.get("status"),
    start_date: formData.get("start_date") || undefined,
    deadline: formData.get("deadline") || undefined,
  })

  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error)
    return {
      fieldErrors,
      error:
        Object.values(fieldErrors).flat()[0] ??
        "Please fix the form errors and try again",
    }
  }

  const data = parsed.data
  const memberIds = formData
    .getAll("member_ids")
    .map(String)
    .filter((id) => id.length > 0)

  try {
    const project = await createProject(
      {
        organization_id: orgId,
        name: data.name,
        client_id: data.client_id || null,
        description: data.description ?? null,
        category_id: data.category_id || null,
        priority: data.priority,
        budget: data.budget,
        currency: "INR",
        status: data.status,
        start_date: data.start_date || null,
        deadline: data.deadline || null,
        delivery_date: null,
        created_by: session.id,
      },
      session.id
    )

    for (const userId of memberIds) {
      await addProjectMember(
        {
          organization_id: orgId,
          project_id: project.id,
          user_id: userId,
          role: "Developer",
          assigned_by: session.id,
          estimated_hours: 40,
          actual_hours: 0,
        },
        session.id
      )
    }

    revalidatePath("/projects")
    revalidatePath(`/projects/${project.id}`)
    return { success: "Project created", id: project.id }
  } catch (err) {
    return {
      error: actionErrorMessage(err, "Failed to create project"),
    }
  }
}

export async function updateProjectAction(
  projectId: string,
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const session = await requireSession()

  const parsed = createProjectSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    client_id: formData.get("client_id") || undefined,
    description: formData.get("description") || undefined,
    category_id: formData.get("category_id") || undefined,
    priority: formData.get("priority") || undefined,
    budget: formData.get("budget") || undefined,
    status: formData.get("status") || undefined,
    start_date: formData.get("start_date") || undefined,
    deadline: formData.get("deadline") || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data

  try {
    await updateProject(
      projectId,
      {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.client_id !== undefined && {
          client_id: data.client_id || null,
        }),
        ...(data.description !== undefined && {
          description: data.description ?? null,
        }),
        ...(data.category_id !== undefined && {
          category_id: data.category_id || null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.start_date !== undefined && {
          start_date: data.start_date || null,
        }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline || null,
        }),
      },
      session.id
    )

    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/projects")
    return { success: "Project updated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update project",
    }
  }
}

export async function deleteProjectAction(
  projectId: string
): Promise<ProjectActionState> {
  try {
    const session = await requireSession()
    await deleteProject(projectId, session.id)
    revalidatePath("/projects")
    return { success: "Project deleted", id: projectId }
  } catch (err) {
    return {
      error: actionErrorMessage(err, "Failed to delete project"),
    }
  }
}

export async function addProjectMemberAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  return addProjectMembersAction(_prev, formData)
}

export async function addProjectMembersAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  const rawIds = [
    ...formData.getAll("user_ids").map(String),
    ...formData.getAll("user_id").map(String),
  ].filter(Boolean)

  const parsed = addProjectMembersSchema.safeParse({
    project_id: formData.get("project_id"),
    user_ids: rawIds,
    role: formData.get("role"),
    estimated_hours: formData.get("estimated_hours"),
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data

  try {
    for (const userId of data.user_ids) {
      await addProjectMember(
        {
          organization_id: orgId,
          project_id: data.project_id,
          user_id: userId,
          role: data.role,
          assigned_by: session.id,
          estimated_hours: data.estimated_hours,
          actual_hours: 0,
        },
        session.id
      )
    }

    revalidatePath(`/projects/${data.project_id}`)
    revalidatePath(`/projects/${data.project_id}/team`)
    return {
      success:
        data.user_ids.length > 1
          ? `${data.user_ids.length} developers assigned`
          : "Developer assigned",
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to add members",
    }
  }
}

export async function removeProjectMemberAction(
  projectId: string,
  userId: string
): Promise<ProjectActionState> {
  await requireSession()

  try {
    await removeProjectMember(projectId, userId)
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/team`)
    return { success: "Member removed" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to remove member",
    }
  }
}

export async function createMilestoneAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  const parsed = createMilestoneSchema.safeParse({
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    due_date: formData.get("due_date") || undefined,
    status: formData.get("status") || "pending",
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const data = parsed.data

  try {
    await createMilestone({
      organization_id: orgId,
      project_id: data.project_id,
      title: data.title,
      description: data.description ?? null,
      amount: data.amount,
      due_date: data.due_date || null,
      status: data.status,
    })

    revalidatePath(`/projects/${data.project_id}`)
    revalidatePath(`/projects/${data.project_id}/milestones`)
    return { success: "Milestone created" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create milestone",
    }
  }
}

export async function updateMilestoneAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  await requireSession()

  const parsed = updateMilestoneSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount") || undefined,
    due_date: formData.get("due_date") || undefined,
    status: formData.get("status") || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  const { id, ...updates } = parsed.data
  const projectId = formData.get("project_id") as string

  try {
    await updateMilestone(id, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && {
        description: updates.description ?? null,
      }),
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.due_date !== undefined && {
        due_date: updates.due_date || null,
      }),
      ...(updates.status !== undefined && { status: updates.status }),
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/milestones`)
    return { success: "Milestone updated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update milestone",
    }
  }
}

export async function updateMilestoneStatusAction(
  milestoneId: string,
  projectId: string,
  status: "pending" | "in_progress" | "completed" | "overdue"
) {
  await requireSession()
  await updateMilestoneStatus(milestoneId, status)
  revalidatePath(`/projects/${projectId}/milestones`)
}

export async function createProjectCategoryAction(
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  const session = await requireSession()
  const orgId = session.organization?.id ?? session.profile.organization_id ?? ORG_ID

  const parsed = projectCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "",
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  try {
    await createProjectCategory({
      organization_id: orgId,
      name: parsed.data.name.trim(),
      color: parsed.data.color || null,
    })
    revalidatePath("/settings/categories")
    revalidatePath("/projects")
    return { success: "Category created" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create category",
    }
  }
}

export async function updateProjectCategoryAction(
  categoryId: string,
  _prev: ProjectActionState | null,
  formData: FormData
): Promise<ProjectActionState> {
  await requireSession()

  const parsed = projectCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "",
  })

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) }
  }

  try {
    await updateProjectCategory(categoryId, {
      name: parsed.data.name.trim(),
      color: parsed.data.color || null,
    })
    revalidatePath("/settings/categories")
    revalidatePath("/projects")
    return { success: "Category updated" }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update category",
    }
  }
}

export async function deleteProjectCategoryAction(categoryId: string) {
  await requireSession()
  await deleteProjectCategory(categoryId)
  revalidatePath("/settings/categories")
  revalidatePath("/projects")
  return { success: true }
}
