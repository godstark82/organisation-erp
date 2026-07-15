"use client"

import { useCreateClientPortalAccessMutation } from "@/features/clients/hooks"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import type { Client } from "@/types"

interface ClientPortalAccessFormProps {
  client: Client
  onSuccess?: () => void
}

export function ClientPortalAccessForm({
  client,
  onSuccess,
}: ClientPortalAccessFormProps) {
  const mutation = useCreateClientPortalAccessMutation(client.id)
  const fieldErrors =
    (mutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    mutation.mutate(formData, {
      onSuccess: () => onSuccess?.(),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-muted-fg text-sm">
        Creates a login so this client can view their projects and submit new
        ones. They cannot assign developers.
      </p>

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

      <TextField
        name="full_name"
        isRequired
        isInvalid={!!fieldErrors?.full_name}
        defaultValue={client.client_name}
      >
        <Label>Display name</Label>
        <Input placeholder="Jane Smith" />
        <FieldError>{fieldErrors?.full_name?.[0]}</FieldError>
      </TextField>

      <TextField
        name="email"
        isRequired
        isInvalid={!!fieldErrors?.email}
        defaultValue={client.email}
      >
        <Label>Login email</Label>
        <Input type="email" placeholder="client@company.com" />
        <FieldError>{fieldErrors?.email?.[0]}</FieldError>
      </TextField>

      <TextField
        name="password"
        isRequired
        isInvalid={!!fieldErrors?.password}
      >
        <Label>Login password</Label>
        <Input
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />
        <FieldError>{fieldErrors?.password?.[0]}</FieldError>
      </TextField>

      <div className="flex justify-end">
        <Button type="submit" intent="primary" isDisabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save login & password"}
        </Button>
      </div>
    </form>
  )
}
