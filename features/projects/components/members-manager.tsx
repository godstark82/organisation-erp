"use client"

import Link from "next/link"
import { TrashIcon } from "@heroicons/react/20/solid"
import { useActionState, useMemo, useState, useTransition } from "react"
import {
  addProjectMembersAction,
  removeProjectMemberAction,
  type ProjectActionState,
} from "@/features/projects/actions"
import type { Profile, ProjectMember } from "@/types"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { formatHours } from "@/lib/utils"

const MEMBER_ROLES = [
  "Project Lead",
  "Developer",
  "Designer",
  "QA",
  "Account Manager",
  "Consultant",
]

const initialState: ProjectActionState = {}

export interface MembersManagerProps {
  projectId: string
  members: ProjectMember[]
  availableUsers: Profile[]
  canManageDevelopers?: boolean
}

export function MembersManager({
  projectId,
  members,
  availableUsers,
  canManageDevelopers = false,
}: MembersManagerProps) {
  const [state, formAction, actionPending] = useActionState(
    addProjectMembersAction,
    initialState
  )
  const [isPending, startTransition] = useTransition()
  const [, setRemoving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const assignedIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  )
  const unassigned = availableUsers.filter((u) => !assignedIds.has(u.id))

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const onAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("project_id", projectId)
    for (const id of selected) {
      formData.append("user_ids", id)
    }
    startTransition(() => {
      formAction(formData)
      setSelected([])
    })
  }

  const onRemove = (userId: string) => {
    setRemoving(true)
    startTransition(async () => {
      await removeProjectMemberAction(projectId, userId)
      setRemoving(false)
    })
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onAdd} className="rounded-xl border border-border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-fg text-sm/6">Assign developers</h3>
          {canManageDevelopers && (
            <Link
              href="/developers"
              className="text-primary text-sm hover:underline"
            >
              Manage developers
            </Link>
          )}
        </div>

        {state?.error && (
          <Note intent="danger" className="mb-4 text-sm">
            {state.error}
          </Note>
        )}
        {state?.success && (
          <Note intent="success" className="mb-4 text-sm">
            {state.success}
          </Note>
        )}

        {unassigned.length === 0 ? (
          <p className="text-muted-fg text-sm">
            {availableUsers.length === 0
              ? "No developers yet. Add them under Developers first."
              : "All available developers are already assigned."}
          </p>
        ) : (
          <div className="mb-4 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
            {unassigned.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={selected.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                />
                <UserAvatar profile={user} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg text-sm">
                    {user.full_name}
                  </span>
                  <span className="block text-muted-fg text-xs">{user.email}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Project role</Label>
            <NativeSelect>
              <NativeSelectContent name="role" defaultValue="Developer" required>
                {MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
          </div>

          <TextField name="estimated_hours" defaultValue="40">
            <Label>Estimated hours each</Label>
            <Input type="number" min={0} />
          </TextField>
        </div>

        <Button
          type="submit"
          intent="primary"
          size="sm"
          className="mt-4"
          isPending={actionPending || isPending}
          isDisabled={selected.length === 0}
        >
          {selected.length > 1
            ? `Add ${selected.length} developers`
            : "Add developer"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-xl border border-border">
        {members.length === 0 ? (
          <p className="p-6 text-center text-muted-fg text-sm/6">
            No developers assigned yet
          </p>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-5 py-4"
            >
              <UserAvatar profile={member.user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg text-sm/6">
                  {member.user?.full_name ?? "Unknown"}
                </p>
                <p className="text-muted-fg text-xs/5">
                  {member.role} · Est. {member.estimated_hours}h · Actual{" "}
                  {formatHours(member.actual_hours * 3600)}
                </p>
              </div>
              <Button
                intent="plain"
                size="sq-sm"
                aria-label="Remove member"
                onPress={() => onRemove(member.user_id)}
              >
                <TrashIcon />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
