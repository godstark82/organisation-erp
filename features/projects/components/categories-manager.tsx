"use client"

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState, useTransition } from "react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { Note } from "@/components/ui/note"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TextField } from "@/components/ui/text-field"
import {
  createProjectCategoryAction,
  deleteProjectCategoryAction,
  updateProjectCategoryAction,
  type ProjectActionState,
} from "@/features/projects/actions"
import type { ProjectCategory } from "@/types"

const initialState: ProjectActionState = {}

const COLOR_PRESETS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#0891b2",
  "#64748b",
]

interface CategoriesManagerProps {
  categories: ProjectCategory[]
}

function CategoryForm({
  action,
  defaultName = "",
  defaultColor = "#2563eb",
  submitLabel,
  onSuccess,
}: {
  action: (
    prev: ProjectActionState | null,
    formData: FormData
  ) => Promise<ProjectActionState>
  defaultName?: string
  defaultColor?: string
  submitLabel: string
  onSuccess?: () => void
}) {
  const [state, formAction, actionPending] = useActionState(action, initialState)
  const [isPending, startTransition] = useTransition()
  const [color, setColor] = useState(defaultColor || "#2563eb")
  const pending = actionPending || isPending

  useEffect(() => {
    if (state?.success) onSuccess?.()
  }, [state?.success, onSuccess])

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        formData.set("color", color)
        startTransition(() => {
          formAction(formData)
        })
      }}
    >
      {state?.error && (
        <Note intent="danger" className="text-sm">
          {state.error}
        </Note>
      )}

      <TextField
        name="name"
        isRequired
        defaultValue={defaultName}
        isInvalid={!!state?.fieldErrors?.name}
      >
        <Label>Name</Label>
        <Input placeholder="Website" />
        <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
      </TextField>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Select ${preset}`}
              className="size-8 rounded-full border-2 transition"
              style={{
                backgroundColor: preset,
                borderColor: color === preset ? "var(--color-fg)" : "transparent",
              }}
              onClick={() => setColor(preset)}
            />
          ))}
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="size-8 min-h-8 cursor-pointer p-0.5"
            aria-label="Custom color"
          />
        </div>
        {state?.fieldErrors?.color?.[0] && (
          <p className="text-danger text-xs">{state.fieldErrors.color[0]}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" intent="primary" isPending={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<ProjectCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectCategory | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const boundUpdate = editCategory
    ? updateProjectCategoryAction.bind(null, editCategory.id)
    : null

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletePending(true)
    setDeleteError(null)
    try {
      await deleteProjectCategoryAction(deleteTarget.id)
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-fg text-base">Project types</h2>
          <p className="text-muted-fg text-sm">
            Categories linked to projects (Website, Mobile App, Ecommerce, …).
          </p>
        </div>
        <Button intent="primary" onPress={() => setCreateOpen(true)}>
          New type
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No project types yet"
          description="Create types so you can classify projects when you add them."
          action={{
            label: "Create type",
            intent: "primary",
            onPress: () => setCreateOpen(true),
          }}
        />
      ) : (
        <Card className="py-0 shadow-sm [--gutter:--spacing(0)]">
          <Table aria-label="Project categories" bleed>
            <TableHeader>
              <TableColumn isRowHeader>Type</TableColumn>
              <TableColumn>Color</TableColumn>
              <TableColumn className="w-24"> </TableColumn>
            </TableHeader>
            <TableBody items={categories}>
              {(category) => (
                <TableRow id={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color ?? "#64748b" }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-fg font-mono text-xs">
                    {category.color ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        intent="plain"
                        size="sq-sm"
                        aria-label="Edit type"
                        onPress={() => setEditCategory(category)}
                      >
                        <PencilSquareIcon />
                      </Button>
                      <Button
                        intent="plain"
                        size="sq-sm"
                        aria-label="Delete type"
                        onPress={() => setDeleteTarget(category)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <ModalContent isOpen={createOpen} onOpenChange={setCreateOpen}>
        <ModalHeader>
          <ModalTitle>New project type</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <CategoryForm
            action={createProjectCategoryAction}
            submitLabel="Create type"
            onSuccess={() => {
              setCreateOpen(false)
              router.refresh()
            }}
          />
        </ModalBody>
      </ModalContent>

      <ModalContent
        isOpen={!!editCategory}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null)
        }}
      >
        <ModalHeader>
          <ModalTitle>Edit project type</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {boundUpdate && editCategory && (
            <CategoryForm
              key={editCategory.id}
              action={boundUpdate}
              defaultName={editCategory.name}
              defaultColor={editCategory.color ?? "#2563eb"}
              submitLabel="Save changes"
              onSuccess={() => {
                setEditCategory(null)
                router.refresh()
              }}
            />
          )}
        </ModalBody>
      </ModalContent>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        title="Delete project type"
        description={
          deleteError ??
          `Delete "${deleteTarget?.name}"? Projects using it will keep running with no type.`
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isPending={deletePending}
        intent="danger"
      />
    </div>
  )
}
