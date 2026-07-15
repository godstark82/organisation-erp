"use client"

import {
  useCreateDeveloperMutation,
  useUpdateDeveloperMutation,
} from "@/features/developers/hooks"
import { STAFF_ROLES } from "@/features/developers/schemas"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { ROLE_LABELS } from "@/lib/rbac"
import type { Profile } from "@/types"

export interface DeveloperFormProps {
  developer?: Profile
  mode?: "create" | "edit"
  onSuccess?: () => void
}

export function DeveloperForm({
  developer,
  mode = "create",
  onSuccess,
}: DeveloperFormProps) {
  const createMutation = useCreateDeveloperMutation()
  const updateMutation = useUpdateDeveloperMutation(developer?.id ?? "")
  const mutation = mode === "edit" ? updateMutation : createMutation
  const pending = mutation.isPending

  const fieldErrors =
    (mutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (mode === "edit") {
      formData.set("is_active", String(developer?.is_active !== false))
    }
    mutation.mutate(formData, {
      onSuccess: () => onSuccess?.(),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.error && (
        <Note intent="danger" className="text-sm">
          {mutation.error.message}
        </Note>
      )}
      {mutation.isSuccess && mutation.data?.success && (
        <Note intent="success" className="text-sm">
          {mutation.data.success}
        </Note>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="full_name"
          isRequired
          isInvalid={!!fieldErrors?.full_name}
          defaultValue={developer?.full_name ?? ""}
        >
          <Label>Full name</Label>
          <Input placeholder="Alex Morgan" />
          <FieldError>{fieldErrors?.full_name?.[0]}</FieldError>
        </TextField>

        <TextField
          name="email"
          isRequired={mode === "create"}
          isInvalid={!!fieldErrors?.email}
          defaultValue={developer?.email ?? ""}
        >
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="alex@agency.com"
            disabled={mode === "edit"}
          />
          <FieldError>{fieldErrors?.email?.[0]}</FieldError>
        </TextField>

        <TextField
          name="phone"
          isInvalid={!!fieldErrors?.phone}
          defaultValue={developer?.phone ?? ""}
        >
          <Label>Phone</Label>
          <Input type="tel" placeholder="+91 98765 43210" />
          <FieldError>{fieldErrors?.phone?.[0]}</FieldError>
        </TextField>

        <TextField
          name="title"
          isInvalid={!!fieldErrors?.title}
          defaultValue={developer?.title ?? ""}
        >
          <Label>Title</Label>
          <Input placeholder="Full-stack developer" />
          <FieldError>{fieldErrors?.title?.[0]}</FieldError>
        </TextField>
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <NativeSelect>
          <NativeSelectContent
            name="role"
            defaultValue={
              STAFF_ROLES.includes(
                developer?.role as (typeof STAFF_ROLES)[number]
              )
                ? developer?.role
                : "developer"
            }
            required
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelectContent>
        </NativeSelect>
        {fieldErrors?.role?.[0] && (
          <FieldError>{fieldErrors.role[0]}</FieldError>
        )}
      </div>

      {mode === "create" && (
        <TextField
          name="password"
          isRequired
          isInvalid={!!fieldErrors?.password}
        >
          <Label>Temporary password</Label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
          <FieldError>{fieldErrors?.password?.[0]}</FieldError>
        </TextField>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" intent="primary" isDisabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add developer"
              : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
