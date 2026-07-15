import {
  addDemoActivityLog,
  enrichComment,
  getDemoProfile,
  getDemoStore,
  ORG_ID,
} from "@/lib/data/demo-store"
import { generateDemoId, touch } from "@/lib/data/demo-utils"
import { isDemoMode } from "@/lib/data/mode"
import { canSeeInternalNotes } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"
import type { AppRole, Comment, InternalNote } from "@/types"

export type CommentEntityType = Comment["entity_type"]

export interface CommentFilters {
  entityType: CommentEntityType
  entityId: string
  includeInternal?: boolean
  viewerRole?: AppRole
}

function canViewInternal(role?: AppRole) {
  return role ? canSeeInternalNotes(role) : false
}

function buildCommentTree(comments: Comment[]): Comment[] {
  const byId = new Map(comments.map((c) => [c.id, { ...c, replies: [] as Comment[] }]))
  const roots: Comment[] = []

  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies!.push(c)
    } else if (!c.parent_id) {
      roots.push(c)
    }
  }

  return roots.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function listComments(
  filters: CommentFilters
): Promise<Comment[]> {
  const showInternal =
    filters.includeInternal ?? canViewInternal(filters.viewerRole)

  if (isDemoMode()) {
    let result = getDemoStore()
      .comments.filter(
        (c) =>
          c.entity_type === filters.entityType &&
          c.entity_id === filters.entityId &&
          c.organization_id === ORG_ID
      )
      .map(enrichComment)

    if (!showInternal) {
      result = result.filter((c) => !c.is_internal)
    }

    return buildCommentTree(result)
  }

  const supabase = await createClient()
  let query = supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("entity_type", filters.entityType)
    .eq("entity_id", filters.entityId)

  if (!showInternal) query = query.eq("is_internal", false)

  const { data, error } = await query.order("created_at")
  if (error) throw error

  return buildCommentTree((data ?? []) as Comment[])
}

export async function getComment(id: string): Promise<Comment | null> {
  if (isDemoMode()) {
    const comment = getDemoStore().comments.find((c) => c.id === id)
    return comment ? enrichComment(comment) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("id", id)
    .single()

  if (error) return null
  return data as Comment
}

export async function createComment(
  input: Omit<Comment, "id" | "created_at" | "updated_at">,
  actorId?: string | null
): Promise<Comment> {
  if (isDemoMode()) {
    const now = touch()
    const comment: Comment = {
      id: generateDemoId(),
      ...input,
      created_at: now,
      updated_at: now,
    }
    getDemoStore().comments.push(comment)
    addDemoActivityLog({
      organization_id: input.organization_id,
      actor_id: actorId ?? input.author_id,
      action: "commented",
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_label: null,
      metadata: { is_internal: input.is_internal },
    })
    return enrichComment(comment)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comments")
    .insert(input)
    .select("*, author:profiles(*)")
    .single()

  if (error) throw error
  return data as Comment
}

export async function updateComment(
  id: string,
  input: Partial<Pick<Comment, "body" | "is_internal">>,
  actorId?: string | null
): Promise<Comment | null> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.comments.findIndex((c) => c.id === id)
    if (idx === -1) return null

    store.comments[idx] = {
      ...store.comments[idx],
      ...input,
      updated_at: touch(),
    }
    addDemoActivityLog({
      organization_id: store.comments[idx].organization_id,
      actor_id: actorId ?? store.comments[idx].author_id,
      action: "updated",
      entity_type: "comment",
      entity_id: id,
      entity_label: null,
      metadata: {},
    })
    return enrichComment(store.comments[idx])
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comments")
    .update(input)
    .eq("id", id)
    .select("*, author:profiles(*)")
    .single()

  if (error) throw error
  return data as Comment
}

export async function deleteComment(
  id: string,
  actorId?: string | null
): Promise<boolean> {
  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.comments.findIndex((c) => c.id === id)
    if (idx === -1) return false

    const [removed] = store.comments.splice(idx, 1)
    store.comments = store.comments.filter((c) => c.parent_id !== id)
    addDemoActivityLog({
      organization_id: removed.organization_id,
      actor_id: actorId ?? null,
      action: "deleted",
      entity_type: "comment",
      entity_id: id,
      entity_label: null,
      metadata: {},
    })
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function listInternalNotes(
  entityType: string,
  entityId: string,
  viewerRole?: AppRole
): Promise<InternalNote[]> {
  if (viewerRole && !canSeeInternalNotes(viewerRole)) {
    return []
  }

  if (isDemoMode()) {
    return getDemoStore()
      .internalNotes.filter(
        (n) => n.entity_type === entityType && n.entity_id === entityId
      )
      .map((n) => ({ ...n, author: getDemoProfile(n.author_id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("internal_notes")
    .select("*, author:profiles(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as InternalNote[]
}

export async function createInternalNote(
  input: Omit<InternalNote, "id" | "created_at" | "updated_at">,
  viewerRole?: AppRole
): Promise<InternalNote> {
  if (viewerRole && !canSeeInternalNotes(viewerRole)) {
    throw new Error("Insufficient permissions to create internal notes")
  }

  if (isDemoMode()) {
    const now = touch()
    const note: InternalNote = {
      id: generateDemoId(),
      ...input,
      created_at: now,
      updated_at: now,
    }
    getDemoStore().internalNotes.push(note)
    return { ...note, author: getDemoProfile(note.author_id) }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("internal_notes")
    .insert(input)
    .select("*, author:profiles(*)")
    .single()

  if (error) throw error
  return data as InternalNote
}

export async function updateInternalNote(
  id: string,
  body: string,
  viewerRole?: AppRole
): Promise<InternalNote | null> {
  if (viewerRole && !canSeeInternalNotes(viewerRole)) {
    throw new Error("Insufficient permissions to update internal notes")
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.internalNotes.findIndex((n) => n.id === id)
    if (idx === -1) return null
    store.internalNotes[idx] = {
      ...store.internalNotes[idx],
      body,
      updated_at: touch(),
    }
    return {
      ...store.internalNotes[idx],
      author: getDemoProfile(store.internalNotes[idx].author_id),
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("internal_notes")
    .update({ body })
    .eq("id", id)
    .select("*, author:profiles(*)")
    .single()

  if (error) throw error
  return data as InternalNote
}

export async function deleteInternalNote(
  id: string,
  viewerRole?: AppRole
): Promise<boolean> {
  if (viewerRole && !canSeeInternalNotes(viewerRole)) {
    throw new Error("Insufficient permissions to delete internal notes")
  }

  if (isDemoMode()) {
    const store = getDemoStore()
    const idx = store.internalNotes.findIndex((n) => n.id === id)
    if (idx === -1) return false
    store.internalNotes.splice(idx, 1)
    return true
  }

  const supabase = await createClient()
  const { error } = await supabase.from("internal_notes").delete().eq("id", id)
  if (error) throw error
  return true
}
