"use client"

import { useActionState, useRef, useTransition } from "react"
import { FileDropzone } from "@/components/shared/file-dropzone"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  markPaidAction,
  type PaymentActionState,
} from "@/features/payments/actions"
import type { Payment } from "@/types"

const initialState: PaymentActionState = {}

interface MarkPaidFormProps {
  payment: Payment
}

export function MarkPaidForm({ payment }: MarkPaidFormProps) {
  const boundAction = markPaidAction.bind(null, payment.id)
  const [state, formAction, actionPending] = useActionState(boundAction, initialState)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleFilesSelect = (files: FileList) => {
    const input = formRef.current?.querySelector(
      'input[name="proofs"]'
    ) as HTMLInputElement | null
    if (input) {
      const dt = new DataTransfer()
      Array.from(files).forEach((f) => dt.items.add(f))
      input.files = dt.files
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  if (payment.status !== "pending" && payment.status !== "rejected") {
    return null
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary-subtle/30 p-4">
        <h3 className="font-medium text-sm">I Have Paid</h3>
        <p className="mt-1 text-muted-fg text-xs">
          Upload your payment screenshot, UTR, or transaction details for admin verification.
        </p>
      </div>

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

      <TextField name="utr" isInvalid={!!state?.fieldErrors?.utr}>
        <Label>UTR / Reference number</Label>
        <Input placeholder="e.g. HDFCN26071234567890" />
        <FieldError>{state?.fieldErrors?.utr?.[0]}</FieldError>
      </TextField>

      <TextField
        name="transaction_id"
        isInvalid={!!state?.fieldErrors?.transaction_id}
      >
        <Label>Transaction ID</Label>
        <Input placeholder="Bank / UPI transaction ID" />
        <FieldError>{state?.fieldErrors?.transaction_id?.[0]}</FieldError>
      </TextField>

      <TextField name="notes">
        <Label>Notes</Label>
        <Textarea
          placeholder="Payment method, bank name, or additional details…"
          rows={2}
        />
      </TextField>

      <div>
        <Label className="mb-2 block">Payment proof</Label>
        <input type="file" name="proofs" multiple className="hidden" accept="image/*,.pdf" />
        <FileDropzone
          onFilesSelect={handleFilesSelect}
          accept="image/*,.pdf"
          allowsMultiple
          maxFiles={5}
          description="Upload screenshot, receipt, or bank statement"
        />
      </div>

      <Button type="submit" intent="primary" isDisabled={actionPending}>
        {actionPending ? "Submitting…" : "I Have Paid"}
      </Button>
    </form>
  )
}
