"use client"

import { useMemo } from "react"
import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from "@/features/payments/hooks"
import type { ProjectPaymentTotal } from "@/features/payments/lib/project-totals"
import type { Client, Payment, Project } from "@/types"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectContent } from "@/components/ui/native-select"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"

export interface PaymentFormProps {
  projects: Project[]
  clients: Client[]
  /** Verified / pending totals keyed by project id */
  projectPaymentTotals?: Record<string, ProjectPaymentTotal>
  mode?: "create" | "edit"
  payment?: Payment | null
  defaultProjectId?: string
  onSuccess?: () => void
  /** Lock client for portal users */
  lockClientId?: string | null
  /** Portal client UX messaging */
  clientMode?: boolean
}

function projectOptionLabel(
  project: Project,
  totals?: ProjectPaymentTotal
) {
  const paid = totals?.paid ?? 0
  const budget = project.budget ?? 0
  const currency = project.currency ?? "INR"
  return `${project.name} · ${formatCurrency(paid, currency)} / ${formatCurrency(budget, currency)}`
}

export function PaymentForm({
  projects,
  clients,
  projectPaymentTotals = {},
  mode = "create",
  payment,
  defaultProjectId,
  onSuccess,
  lockClientId = null,
  clientMode = false,
}: PaymentFormProps) {
  const createMutation = useCreatePaymentMutation()
  const updateMutation = useUpdatePaymentMutation(payment?.id ?? "")
  const mutation = mode === "edit" ? updateMutation : createMutation
  const pending = mutation.isPending

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

  const scopedProjects = useMemo(
    () =>
      lockClientId
        ? projects.filter((p) => p.client_id === lockClientId)
        : projects,
    [projects, lockClientId]
  )

  const defaultProject =
    payment?.project_id ??
    defaultProjectId ??
    scopedProjects[0]?.id ??
    ""
  const defaultClient =
    lockClientId ??
    payment?.client_id ??
    scopedProjects.find((p) => p.id === defaultProject)?.client_id ??
    ""

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {mutation.error && (
        <Note intent="danger" className="text-sm">
          {mutation.error.message}
        </Note>
      )}

      {mode === "create" && (
        <Note intent="info" className="text-sm">
          {clientMode
            ? "Recording this payment counts as your acceptance. The project team (or a super admin) must also accept before it is verified."
            : "Recording this payment counts as team acceptance. The client must also accept before it is verified."}
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
              {scopedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {projectOptionLabel(
                    project,
                    projectPaymentTotals[project.id]
                  )}
                </option>
              ))}
            </NativeSelectContent>
          </NativeSelect>
          <p className="text-muted-fg text-xs">
            Amounts show verified paid / project budget.
          </p>
          {fieldErrors?.project_id?.[0] && (
            <FieldError>{fieldErrors.project_id[0]}</FieldError>
          )}
        </div>

        {lockClientId ? (
          <input type="hidden" name="client_id" value={lockClientId} />
        ) : (
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
        )}

        <TextField
          name="amount"
          isRequired
          isInvalid={!!fieldErrors?.amount}
          defaultValue={
            payment?.amount != null ? String(payment.amount) : ""
          }
        >
          <Label>Amount</Label>
          <Input type="number" min={1} step={0.01} />
          <FieldError>{fieldErrors?.amount?.[0]}</FieldError>
        </TextField>

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
