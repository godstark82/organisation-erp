"use client"

import { useRef, useState } from "react"
import { FileDropzone } from "@/components/shared/file-dropzone"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  useAcceptPaymentMutation,
  useRejectPaymentMutation,
} from "@/features/payments/hooks"
import {
  hasClientAccepted,
  hasStaffAccepted,
  needsClientAcceptance,
  needsStaffAcceptance,
} from "@/features/payments/lib/acceptance"
import { formatDate } from "@/lib/utils"
import type { Payment } from "@/types"

interface AcceptPaymentPanelProps {
  payment: Payment
  isClient: boolean
  canStaffAccept: boolean
}

export function AcceptPaymentPanel({
  payment,
  isClient,
  canStaffAccept,
}: AcceptPaymentPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const acceptMutation = useAcceptPaymentMutation(payment.id)
  const rejectMutation = useRejectPaymentMutation(payment.id)

  const clientDone = hasClientAccepted(payment)
  const staffDone = hasStaffAccepted(payment)
  const showClientAccept = isClient && needsClientAcceptance(payment)
  const showStaffAccept = canStaffAccept && needsStaffAcceptance(payment)
  const showReject =
    canStaffAccept &&
    payment.status !== "verified" &&
    payment.status !== "disputed"

  if (payment.status === "verified") {
    return (
      <div className="rounded-lg border border-success/30 bg-success-subtle/20 p-4 text-sm">
        <h3 className="font-medium">Verified</h3>
        <p className="mt-1 text-muted-fg text-xs">
          Both the client and the project team accepted this payment
          {payment.verified_at ? ` on ${formatDate(payment.verified_at)}` : ""}.
        </p>
      </div>
    )
  }

  if (!showClientAccept && !showStaffAccept && !showReject) {
    return (
      <AcceptanceChecklist
        clientDone={clientDone}
        staffDone={staffDone}
        clientAt={payment.client_accepted_at}
        staffAt={payment.staff_accepted_at}
      />
    )
  }

  const fieldErrors =
    (acceptMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined
  const rejectFieldErrors =
    (rejectMutation.error as Error & { fieldErrors?: Record<string, string[]> })
      ?.fieldErrors ?? undefined

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

  const handleAccept = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    acceptMutation.mutate(new FormData(event.currentTarget))
  }

  const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    rejectMutation.mutate(new FormData(event.currentTarget), {
      onSuccess: () => setRejectOpen(false),
    })
  }

  return (
    <div className="space-y-4">
      <AcceptanceChecklist
        clientDone={clientDone}
        staffDone={staffDone}
        clientAt={payment.client_accepted_at}
        staffAt={payment.staff_accepted_at}
      />

      {(showClientAccept || showStaffAccept) && (
        <form ref={formRef} onSubmit={handleAccept} className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary-subtle/30 p-4">
            <h3 className="font-medium text-sm">
              {showClientAccept ? "Accept this payment" : "Accept for the team"}
            </h3>
            <p className="mt-1 text-muted-fg text-xs">
              {showClientAccept
                ? "Confirm this payment record. Once the project team also accepts, it becomes verified."
                : "Confirm this payment on behalf of the project team. Once the client also accepts, it becomes verified."}
            </p>
          </div>

          {acceptMutation.error && (
            <Note intent="danger" className="text-sm">
              {acceptMutation.error.message}
            </Note>
          )}
          {acceptMutation.isSuccess && acceptMutation.data?.success && (
            <Note intent="success" className="text-sm">
              {acceptMutation.data.success}
            </Note>
          )}

          <TextField name="utr" isInvalid={!!fieldErrors?.utr} defaultValue={payment.utr ?? ""}>
            <Label>UTR / Reference (optional)</Label>
            <Input placeholder="e.g. HDFCN26071234567890" />
            <FieldError>{fieldErrors?.utr?.[0]}</FieldError>
          </TextField>

          <TextField
            name="transaction_id"
            isInvalid={!!fieldErrors?.transaction_id}
            defaultValue={payment.transaction_id ?? ""}
          >
            <Label>Transaction ID (optional)</Label>
            <Input />
            <FieldError>{fieldErrors?.transaction_id?.[0]}</FieldError>
          </TextField>

          <TextField name="notes" defaultValue={payment.notes ?? ""}>
            <Label>Notes (optional)</Label>
            <Textarea rows={2} />
          </TextField>

          <div>
            <Label className="mb-2 block">Proof (optional)</Label>
            <input
              type="file"
              name="proofs"
              multiple
              className="hidden"
              accept="image/*,.pdf"
            />
            <FileDropzone
              onFilesSelect={handleFilesSelect}
              accept="image/*,.pdf"
              allowsMultiple
              maxFiles={5}
              description="Screenshot, receipt, or bank statement"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              intent="primary"
              isDisabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? "Accepting…" : "Accept payment"}
            </Button>
            {showReject && (
              <Button intent="danger" onPress={() => setRejectOpen(true)}>
                Reject
              </Button>
            )}
          </div>
        </form>
      )}

      {showReject && !showStaffAccept && (
        <Button intent="danger" size="sm" onPress={() => setRejectOpen(true)}>
          Reject
        </Button>
      )}

      <ModalContent isOpen={rejectOpen} onOpenChange={setRejectOpen} size="md">
        <ModalHeader>
          <ModalTitle>Reject payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleReject} className="space-y-4">
            {rejectMutation.error && (
              <Note intent="danger" className="text-sm">
                {rejectMutation.error.message}
              </Note>
            )}
            <TextField
              name="rejection_reason"
              isRequired
              isInvalid={!!rejectFieldErrors?.rejection_reason}
            >
              <Label>Rejection reason</Label>
              <Textarea
                rows={4}
                placeholder="Explain why this payment is being rejected…"
              />
              <FieldError>{rejectFieldErrors?.rejection_reason?.[0]}</FieldError>
            </TextField>
            <div className="flex justify-end gap-2">
              <Button intent="plain" size="sm" onPress={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                intent="danger"
                size="sm"
                isDisabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting…" : "Reject payment"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </div>
  )
}

function AcceptanceChecklist({
  clientDone,
  staffDone,
  clientAt,
  staffAt,
}: {
  clientDone: boolean
  staffDone: boolean
  clientAt: string | null
  staffAt: string | null
}) {
  return (
    <div className="rounded-lg border border-border p-4 text-sm">
      <h3 className="font-medium">Mutual acceptance</h3>
      <p className="mt-1 text-muted-fg text-xs">
        Both sides must accept before a payment is verified.
      </p>
      <ul className="mt-3 space-y-2">
        <li className="flex items-center justify-between gap-2">
          <span>Client</span>
          <span
            className={
              clientDone ? "font-medium text-success" : "text-muted-fg"
            }
          >
            {clientDone
              ? `Accepted${clientAt ? ` · ${formatDate(clientAt)}` : ""}`
              : "Pending"}
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span>Project team / admin</span>
          <span
            className={staffDone ? "font-medium text-success" : "text-muted-fg"}
          >
            {staffDone
              ? `Accepted${staffAt ? ` · ${formatDate(staffAt)}` : ""}`
              : "Pending"}
          </span>
        </li>
      </ul>
    </div>
  )
}
