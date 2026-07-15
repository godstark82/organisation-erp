"use client"

import { PencilIcon, PlusIcon } from "@heroicons/react/20/solid"
import { useState } from "react"
import type { Milestone, MilestoneStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
} from "@/features/projects/hooks"
import { updateMilestoneStatusAction } from "@/features/projects/actions"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

const MILESTONE_STATUSES: { value: MilestoneStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
]

export interface MilestonesListProps {
  projectId: string
  milestones: Milestone[]
  inline?: boolean
}

export function MilestonesList({
  projectId,
  milestones,
  inline = false,
}: MilestonesListProps) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const createMutation = useCreateMilestoneMutation(projectId)
  const updateMutation = useUpdateMilestoneMutation(projectId)
  const statusMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      status,
    }: {
      milestoneId: string
      status: MilestoneStatus
    }) => {
      await updateMilestoneStatusAction(milestoneId, projectId, status)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })

  const editing = milestones.find((m) => m.id === editingId)
  const stateError = createMutation.error?.message ?? updateMutation.error?.message
  const createFieldErrors =
    (createMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined
  const updateFieldErrors =
    (updateMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const onCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("project_id", projectId)
    createMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
    })
  }

  const onUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set("project_id", projectId)
    updateMutation.mutate(formData, {
      onSuccess: () => setEditingId(null),
    })
  }

  const onStatusChange = (milestoneId: string, status: MilestoneStatus) => {
    statusMutation.mutate({ milestoneId, status })
  }

  return (
    <div className="space-y-4">
      {!inline && (
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-fg text-sm/6">Milestones</h3>
          <Button intent="outline" size="sm" onPress={() => setShowForm((v) => !v)}>
            <PlusIcon />
            Add milestone
          </Button>
        </div>
      )}

      {stateError && (
        <Note intent="danger" className="text-sm">
          {stateError}
        </Note>
      )}

      {showForm && (
        <form
          onSubmit={onCreate}
          className="space-y-4 rounded-xl border border-border p-5"
        >
          <h4 className="font-medium text-sm/6">New milestone</h4>
          <MilestoneFields fieldErrors={createFieldErrors} />
          <div className="flex gap-2">
            <Button type="submit" intent="primary" size="sm" isPending={createMutation.isPending}>
              Create
            </Button>
            <Button type="button" intent="plain" size="sm" onPress={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {editing && (
        <form
          onSubmit={onUpdate}
          className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5"
        >
          <input type="hidden" name="id" value={editing.id} />
          <h4 className="font-medium text-sm/6">Edit milestone</h4>
          <MilestoneFields defaultValues={editing} fieldErrors={updateFieldErrors} />
          <div className="flex gap-2">
            <Button type="submit" intent="primary" size="sm" isPending={updateMutation.isPending}>
              Save
            </Button>
            <Button type="button" intent="plain" size="sm" onPress={() => setEditingId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {milestones.length === 0 ? (
          <p className="p-6 text-center text-muted-fg text-sm/6">No milestones yet</p>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex flex-wrap items-center gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg text-sm/6">{milestone.title}</p>
                {milestone.description && (
                  <p className="mt-0.5 text-muted-fg text-xs/5 line-clamp-2">
                    {milestone.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-fg text-xs/5">
                  <span>Due {formatDate(milestone.due_date)}</span>
                  {milestone.amount > 0 && (
                    <span>{formatCurrency(milestone.amount)}</span>
                  )}
                </div>
              </div>

              <Select
                selectedKey={milestone.status}
                onSelectionChange={(key) =>
                  onStatusChange(milestone.id, key as MilestoneStatus)
                }
              >
                <SelectTrigger className="w-36" />
                <SelectContent items={MILESTONE_STATUSES}>
                  {(item) => (
                    <SelectItem id={item.value} textValue={item.label}>
                      {item.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Badge
                intent={
                  milestone.status === "completed"
                    ? "success"
                    : milestone.status === "overdue"
                      ? "danger"
                      : milestone.status === "in_progress"
                        ? "primary"
                        : "secondary"
                }
                isCircle={false}
              >
                {MILESTONE_STATUSES.find((s) => s.value === milestone.status)?.label}
              </Badge>

              <Button
                intent="plain"
                size="sq-sm"
                aria-label="Edit milestone"
                onPress={() => setEditingId(milestone.id)}
              >
                <PencilIcon />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MilestoneFields({
  defaultValues,
  fieldErrors,
}: {
  defaultValues?: Milestone
  fieldErrors?: Record<string, string[]>
}) {
  return (
    <>
      <TextField
        name="title"
        isRequired
        isInvalid={!!fieldErrors?.title}
        defaultValue={defaultValues?.title ?? ""}
      >
        <Label>Title</Label>
        <Input />
        <FieldError>{fieldErrors?.title?.[0]}</FieldError>
      </TextField>

      <TextField
        name="description"
        defaultValue={defaultValues?.description ?? ""}
      >
        <Label>Description</Label>
        <Textarea rows={2} />
      </TextField>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="amount"
          defaultValue={String(defaultValues?.amount ?? 0)}
        >
          <Label>Amount</Label>
          <Input type="number" min={0} />
        </TextField>

        <TextField
          name="due_date"
          defaultValue={defaultValues?.due_date?.slice(0, 10) ?? ""}
        >
          <Label>Due date</Label>
          <Input type="date" />
        </TextField>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <NativeSelect>
            <NativeSelectContent
              name="status"
              defaultValue={defaultValues?.status ?? "pending"}
            >
              {MILESTONE_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
        </div>
      </div>
    </>
  )
}
