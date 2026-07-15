"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useActionState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import type { ClientActionState } from "@/features/clients/actions"
import {
  clientFormDefaults,
  clientFormSchema,
  type ClientFormInput,
} from "@/features/clients/schemas"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import { CLIENT_STATUSES } from "@/lib/constants"
import type { Client } from "@/types"

const initialState: ClientActionState = {}

function toFormValues(client?: Partial<Client>): ClientFormInput {
  if (!client) return clientFormDefaults
  return {
    company_name: client.company_name ?? "",
    client_name: client.client_name ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    gst: client.gst ?? "",
    address: client.address ?? "",
    country: client.country ?? "",
    notes: client.notes ?? "",
    status: client.status ?? "lead",
  }
}

export interface ClientFormProps {
  action: (
    prev: ClientActionState | null,
    formData: FormData
  ) => Promise<ClientActionState>
  client?: Client
  submitLabel?: string
  onSuccess?: () => void
}

export function ClientForm({
  action,
  client,
  submitLabel = "Save client",
  onSuccess,
}: ClientFormProps) {
  const [state, formAction, actionPending] = useActionState(action, initialState)
  const [isPending, startTransition] = useTransition()
  const pending = actionPending || isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: toFormValues(client),
  })

  useEffect(() => {
    reset(toFormValues(client))
  }, [client, reset])

  useEffect(() => {
    if (state?.success) {
      onSuccess?.()
    }
  }, [state?.success, onSuccess])

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(data)) {
      formData.set(key, value == null ? "" : String(value))
    }
    startTransition(() => {
      formAction(formData)
    })
  })

  const fieldError = (name: keyof ClientFormInput) =>
    errors[name]?.message ?? state?.fieldErrors?.[name]?.[0]

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
        <TextField isRequired isInvalid={!!fieldError("company_name")}>
          <Label>Company name</Label>
          <Input placeholder="Acme Corp" {...register("company_name")} />
          <FieldError>{fieldError("company_name")}</FieldError>
        </TextField>

        <TextField isRequired isInvalid={!!fieldError("client_name")}>
          <Label>Contact name</Label>
          <Input placeholder="Jane Smith" {...register("client_name")} />
          <FieldError>{fieldError("client_name")}</FieldError>
        </TextField>

        <TextField isRequired isInvalid={!!fieldError("email")}>
          <Label>Email</Label>
          <Input type="email" placeholder="jane@acme.com" {...register("email")} />
          <FieldError>{fieldError("email")}</FieldError>
        </TextField>

        <TextField isInvalid={!!fieldError("phone")}>
          <Label>Phone</Label>
          <Input type="tel" placeholder="+91 98765 43210" {...register("phone")} />
          <FieldError>{fieldError("phone")}</FieldError>
        </TextField>

        <TextField isInvalid={!!fieldError("gst")}>
          <Label>GST / Tax ID</Label>
          <Input placeholder="22AAAAA0000A1Z5" {...register("gst")} />
          <FieldError>{fieldError("gst")}</FieldError>
        </TextField>

        <TextField isInvalid={!!fieldError("country")}>
          <Label>Country</Label>
          <Input placeholder="India" {...register("country")} />
          <FieldError>{fieldError("country")}</FieldError>
        </TextField>
      </div>

      <TextField isInvalid={!!fieldError("address")}>
        <Label>Address</Label>
        <Textarea
          placeholder="Street, city, state, postal code"
          {...register("address")}
        />
        <FieldError>{fieldError("address")}</FieldError>
      </TextField>

      <TextField isInvalid={!!fieldError("status")}>
        <Label>Status</Label>
        <NativeSelect>
          <NativeSelectContent {...register("status")}>
            {CLIENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </NativeSelectContent>
        </NativeSelect>
        <FieldError>{fieldError("status")}</FieldError>
      </TextField>

      <TextField isInvalid={!!fieldError("notes")}>
        <Label>Notes</Label>
        <Textarea
          placeholder="Internal notes about this client…"
          {...register("notes")}
        />
        <FieldError>{fieldError("notes")}</FieldError>
      </TextField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" intent="primary" isDisabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
