"use client"

import { useActionState, useEffect, useTransition } from "react"
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionState,
} from "@/features/projects/actions"
import type { Client, Profile, ProjectCategory } from "@/types"
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/components/shared/user-avatar"

const initialState: ProjectActionState = {}

export interface ProjectFormProps {
  clients: Client[]
  categories: ProjectCategory[]
  developers?: Profile[]
  mode?: "create" | "edit"
  projectId?: string
  defaultMemberIds?: string[]
  defaultValues?: {
    name?: string
    client_id?: string
    description?: string
    category_id?: string
    priority?: string
    budget?: number
    status?: string
    start_date?: string
    deadline?: string
  }
  onSuccess?: () => void
}

export function ProjectForm({
  clients,
  categories,
  developers = [],
  mode = "create",
  projectId,
  defaultMemberIds = [],
  defaultValues,
  onSuccess,
}: ProjectFormProps) {
  const boundUpdate = updateProjectAction.bind(null, projectId ?? "")
  const [state, formAction, actionPending] = useActionState(
    mode === "edit" ? boundUpdate : createProjectAction,
    initialState
  )
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending

  useEffect(() => {
    if (state?.success) onSuccess?.()
  }, [state?.success, onSuccess])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error && (
        <Note intent="danger" className="text-sm break-words">
          {state.error}
        </Note>
      )}
      {state?.fieldErrors &&
        Object.keys(state.fieldErrors).length > 0 &&
        !state.error && (
          <Note intent="danger" className="text-sm">
            {Object.values(state.fieldErrors).flat().join(" ")}
          </Note>
        )}

      <FieldGroup>
        <TextField
          name="name"
          isRequired
          isInvalid={!!state?.fieldErrors?.name}
          defaultValue={defaultValues?.name ?? ""}
        >
          <Label>Project name</Label>
          <Input placeholder="Website redesign" />
          <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
        </TextField>

        <div className="space-y-1.5">
          <Label>Client</Label>
          <NativeSelect>
            <NativeSelectContent
              name="client_id"
              defaultValue={defaultValues?.client_id ?? ""}
            >
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
        </div>

        <TextField
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        >
          <Label>Description</Label>
          <Textarea placeholder="Project scope and goals…" rows={3} />
        </TextField>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Project type</Label>
            <NativeSelect>
              <NativeSelectContent
                name="category_id"
                defaultValue={defaultValues?.category_id ?? ""}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <NativeSelect>
              <NativeSelectContent
                name="status"
                defaultValue={defaultValues?.status ?? "planning"}
                required
              >
                {PROJECT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <NativeSelect>
              <NativeSelectContent
                name="priority"
                defaultValue={defaultValues?.priority ?? "medium"}
                required
              >
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
          </div>

          <TextField
            name="budget"
            defaultValue={String(defaultValues?.budget ?? 0)}
          >
            <Label>Budget (INR)</Label>
            <Input type="number" min={0} step={1000} />
          </TextField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="start_date"
            defaultValue={defaultValues?.start_date ?? ""}
          >
            <Label>Start date</Label>
            <Input type="date" />
          </TextField>

          <TextField
            name="deadline"
            defaultValue={defaultValues?.deadline ?? ""}
          >
            <Label>Deadline</Label>
            <Input type="date" />
          </TextField>
        </div>

        {mode === "create" && developers.length > 0 && (
          <div className="space-y-2">
            <Label>Assign developers</Label>
            <p className="text-muted-fg text-xs">
              Select one or more developers for this project. You can change this later on the Team tab.
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
              {developers.map((developer) => (
                <label
                  key={developer.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    name="member_ids"
                    value={developer.id}
                    defaultChecked={defaultMemberIds.includes(developer.id)}
                    className="size-4 rounded border-input"
                  />
                  <UserAvatar profile={developer} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-fg text-sm">
                      {developer.full_name}
                    </span>
                    <span className="block text-muted-fg text-xs">
                      {developer.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" intent="primary" isPending={pending}>
          {mode === "create" ? "Create project" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
