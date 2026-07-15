"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FieldError, Label } from "@/components/ui/field"
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal"
import { Note } from "@/components/ui/note"
import { TextField } from "@/components/ui/text-field"
import { Textarea } from "@/components/ui/textarea"
import {
  rejectPaymentAction,
  reviewPaymentAction,
  verifyPaymentAction,
  type PaymentActionState,
} from "@/features/payments/actions"
import type { Payment } from "@/types"

const initialState: PaymentActionState = {}

interface VerifyActionsProps {
  payment: Payment
}

export function VerifyActions({ payment }: VerifyActionsProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reviewPending, setReviewPending] = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const boundRejectAction = rejectPaymentAction.bind(null, payment.id)
  const [rejectState, rejectAction, rejectPending] = useActionState(
    boundRejectAction,
    initialState
  )

  const handleReview = () => {
    setActionError(null)
    setReviewPending(true)
    startTransition(async () => {
      const result = await reviewPaymentAction(payment.id)
      if (result.error) setActionError(result.error)
      else router.refresh()
      setReviewPending(false)
    })
  }

  const handleVerify = () => {
    setActionError(null)
    setVerifyPending(true)
    startTransition(async () => {
      const result = await verifyPaymentAction(payment.id)
      if (result.error) setActionError(result.error)
      else router.refresh()
      setVerifyPending(false)
    })
  }

  const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => {
      rejectAction(formData)
      setRejectOpen(false)
      router.refresh()
    })
  }

  const canReview = payment.status === "client_marked_paid"
  const canVerifyReject =
    payment.status === "under_review" || payment.status === "client_marked_paid"

  if (!canReview && !canVerifyReject) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-warning/30 bg-warning-subtle/20 p-4">
        <h3 className="font-medium text-sm">Admin verification</h3>
        <p className="mt-1 text-muted-fg text-xs">
          Review payment proof, then verify or reject. Clients cannot verify payments.
        </p>
      </div>

      {actionError && (
        <Note intent="danger" className="text-sm">{actionError}</Note>
      )}

      <div className="flex flex-wrap gap-2">
        {canReview && (
          <Button
            intent="secondary"
            size="sm"
            isDisabled={reviewPending}
            onPress={handleReview}
          >
            {reviewPending ? "Moving…" : "Move to Under Review"}
          </Button>
        )}
        {canVerifyReject && (
          <>
            <Button
              intent="success"
              size="sm"
              isDisabled={verifyPending}
              onPress={handleVerify}
            >
              {verifyPending ? "Verifying…" : "Verify payment"}
            </Button>
            <Button
              intent="danger"
              size="sm"
              onPress={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </>
        )}
      </div>

      <ModalContent
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Reject payment</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleReject} className="space-y-4">
            {rejectState?.error && (
              <Note intent="danger" className="text-sm">{rejectState.error}</Note>
            )}
            <TextField
              name="rejection_reason"
              isRequired
              isInvalid={!!rejectState?.fieldErrors?.rejection_reason}
            >
              <Label>Rejection reason</Label>
              <Textarea
                rows={4}
                placeholder="Explain why this payment is being rejected…"
              />
              <FieldError>{rejectState?.fieldErrors?.rejection_reason?.[0]}</FieldError>
            </TextField>
            <div className="flex justify-end gap-2">
              <Button intent="plain" size="sm" onPress={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" intent="danger" size="sm" isDisabled={rejectPending}>
                {rejectPending ? "Rejecting…" : "Reject payment"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </div>
  )
}
