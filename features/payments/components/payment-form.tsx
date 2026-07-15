"use client"

import { useActionState, useEffect, useTransition } from "react"
import {
  createPaymentAction,
  updatePaymentAction,
  type PaymentActionState,
} from "@/features/payments/actions"
import type { Client, Payment, Project } from "@/types"
import { PAYMENT_STATUSES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"

const initialState: PaymentActionState = {}

export interface PaymentFormProps {
  projects: Project[]
  clients: Client[]
  mode?: "create" | "edit"
  payment?: Payment | null
  defaultProjectId?: string
  onSuccess?: () => void
}

export function PaymentForm({
  projects,
  clients,
  mode = "create",
  payment,
  defaultProjectId,
  onSuccess,
}: PaymentFormProps) {
  const boundUpdate = updatePaymentAction.bind(null, payment?.id ?? "")
  const [state, formAction, actionPending] = useActionState(
    mode === "edit" ? boundUpdate : createPaymentAction,
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

  const defaultProject =
    payment?.project_id ?? defaultProjectId ?? projects[0]?.id ?? ""
  const defaultClient =
    payment?.client_id ??
    projects.find((p) => p.id === defaultProject)?.client_id ??
    ""

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error && (
        <Note intent="danger" className="text-sm">
          {state.error}
        </Note>
      )}

      <FieldGroup>
        <div className="space-y-1.5">
          <Label>Project</Label>
          <NativeSelect>
            <NativeSelectContent
              name="project_id"
              defaultValue={defaultProject}
              required
            >
              <option value="" disabled>
                Select project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
          {state?.fieldErrors?.project_id?.[0] && (
            <FieldError>{state.fieldErrors.project_id[0]}</FieldError>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Client</Label>
          <NativeSelect>
            <NativeSelectContent
              name="client_id"
              defaultValue={defaultClient || ""}
            >
              <option value="">Use project client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="amount"
            isRequired
            isInvalid={!!state?.fieldErrors?.amount}
            defaultValue={
              payment?.amount != null ? String(payment.amount) : ""
            }
          >
            <Label>Amount</Label>
            <Input type="number" min={1} step={0.01} />
            <FieldError>{state?.fieldErrors?.amount?.[0]}</FieldError>
          </TextField>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <NativeSelect>
              <NativeSelectContent
                name="status"
                defaultValue={payment?.status ?? "pending"}
                required
              >
                {PAYMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelectContent>
            </NativeSelect>
          </div>
        </div>

        <TextField
          name="paid_at"
          defaultValue={payment?.paid_at?.slice(0, 10) ?? ""}
        >
          <Label>Paid on</Label>
          <Input type="date" />
        </TextField>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="utr" defaultValue={payment?.utr ?? ""}>
            <Label>UTR</Label>
            <Input />
          </TextField>
          <TextField
            name="transaction_id"
            defaultValue={payment?.transaction_id ?? ""}
          >
            <Label>Transaction ID</Label>
            <Input />
          </TextField>
        </div>

        <TextField name="notes" defaultValue={payment?.notes ?? ""}>
          <Label>Notes</Label>
          <Textarea rows={3} placeholder="Payment method, bank, reference…" />
        </TextField>

        <input type="hidden" name="currency" value="INR" />
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" intent="primary" isPending={pending}>
          {mode === "create" ? "Record payment" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
