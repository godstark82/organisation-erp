import { z } from "zod"

export const createPaymentSchema = z.object({
  project_id: z.string().uuid("Select a project"),
  client_id: z.string().uuid("Select a client").optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().default("INR"),
  paid_at: z.string().optional().nullable(),
  utr: z.string().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id: z.string().uuid(),
})

export const acceptPaymentSchema = z.object({
  utr: z.string().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const markPaidSchema = acceptPaymentSchema

export const rejectPaymentSchema = z.object({
  rejection_reason: z.string().min(3, "Please provide a rejection reason"),
})

export const raiseDisputeSchema = z.object({
  reason: z.string().min(10, "Please describe the dispute (min 10 characters)"),
  expected_amount: z.coerce.number().positive().optional().nullable(),
  received_amount: z.coerce.number().nonnegative().optional().nullable(),
  message: z.string().min(1, "Initial message is required"),
})

export const replyDisputeSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type MarkPaidInput = z.infer<typeof markPaidSchema>
export type RaiseDisputeInput = z.infer<typeof raiseDisputeSchema>
