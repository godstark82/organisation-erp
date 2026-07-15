"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import {
  useCreateClientMutation,
  useUpdateClientMutation,
} from "@/features/clients/hooks"
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
  client?: Client
  submitLabel?: string
  onSuccess?: () => void
  /** When true, skip navigation after create (e.g. stay in modal). */
  stayOnCreate?: boolean
}

export function ClientForm({
  client,
  submitLabel = "Save client",
  onSuccess,
  stayOnCreate = false,
}: ClientFormProps) {
  const router = useRouter()
  const createMutation = useCreateClientMutation()
  const updateMutation = useUpdateClientMutation(client?.id ?? "")
  const mutation = client ? updateMutation : createMutation
  const pending = mutation.isPending

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

  const fieldErrors =
    (mutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

  const fieldError = (name: keyof ClientFormInput) =>
    errors[name]?.message ?? fieldErrors?.[name]?.[0]

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data, {
      onSuccess: (result) => {
        if (!client && result.id && !stayOnCreate) {
          router.push(`/clients/${result.id}`)
          return
        }
        onSuccess?.()
      },
    })
  })

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
