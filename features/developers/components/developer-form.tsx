"use client"

import { useActionState, useEffect, useTransition } from "react"
import type { DeveloperActionState } from "@/features/developers/actions"
import { STAFF_ROLES } from "@/features/developers/schemas"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { ROLE_LABELS } from "@/lib/rbac"
import type { Profile } from "@/types"

const initialState: DeveloperActionState = {}

export interface DeveloperFormProps {
  action: (
    prev: DeveloperActionState | null,
    formData: FormData
  ) => Promise<DeveloperActionState>
  developer?: Profile
  mode?: "create" | "edit"
  onSuccess?: () => void
}

export function DeveloperForm({
  action,
  developer,
  mode = "create",
  onSuccess,
}: DeveloperFormProps) {
  const [state, formAction, actionPending] = useActionState(action, initialState)
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending

  useEffect(() => {
    if (state?.success) onSuccess?.()
  }, [state?.success, onSuccess])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (mode === "edit") {
      formData.set("is_active", String(developer?.is_active !== false))
    }
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error && (
        <Note intent="danger" className="text-sm">
          {state.error}
        </Note>
      )}
      {state?.success && (
        <Note intent="success" className="text-sm">
          {state.success}
        </Note>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="full_name"
          isRequired
          isInvalid={!!state?.fieldErrors?.full_name}
          defaultValue={developer?.full_name ?? ""}
        >
          <Label>Full name</Label>
          <Input placeholder="Alex Morgan" />
          <FieldError>{state?.fieldErrors?.full_name?.[0]}</FieldError>
        </TextField>

        <TextField
          name="email"
          isRequired={mode === "create"}
          isInvalid={!!state?.fieldErrors?.email}
          defaultValue={developer?.email ?? ""}
        >
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="alex@agency.com"
            disabled={mode === "edit"}
          />
          <FieldError>{state?.fieldErrors?.email?.[0]}</FieldError>
        </TextField>

        <TextField
          name="phone"
          isInvalid={!!state?.fieldErrors?.phone}
          defaultValue={developer?.phone ?? ""}
        >
          <Label>Phone</Label>
          <Input type="tel" placeholder="+91 98765 43210" />
          <FieldError>{state?.fieldErrors?.phone?.[0]}</FieldError>
        </TextField>

        <TextField
          name="title"
          isInvalid={!!state?.fieldErrors?.title}
          defaultValue={developer?.title ?? ""}
        >
          <Label>Title</Label>
          <Input placeholder="Full-stack developer" />
          <FieldError>{state?.fieldErrors?.title?.[0]}</FieldError>
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
        {state?.fieldErrors?.role?.[0] && (
          <FieldError>{state.fieldErrors.role[0]}</FieldError>
        )}
      </div>

      {mode === "create" && (
        <TextField
          name="password"
          isRequired
          isInvalid={!!state?.fieldErrors?.password}
        >
          <Label>Temporary password</Label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
          <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
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
