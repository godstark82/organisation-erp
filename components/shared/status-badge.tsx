import {
  CLIENT_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
} from '@/lib/constants'
import type {
  ClientStatus,
  InvoiceStatus,
  PaymentStatus,
  PriorityLevel,
  ProjectStatus,
  TaskStatus,
} from '@/types'
import { Badge, type BadgeProps } from '@/components/ui/badge'

type StatusType = 'project' | 'task' | 'invoice' | 'payment' | 'client' | 'priority'

type StatusValue =
  | ProjectStatus
  | TaskStatus
  | InvoiceStatus
  | PaymentStatus
  | ClientStatus
  | PriorityLevel

const STATUS_LABELS: Record<StatusType, { value: string; label: string }[]> = {
  project: PROJECT_STATUSES,
  task: TASK_STATUSES,
  invoice: INVOICE_STATUSES,
  payment: PAYMENT_STATUSES,
  client: CLIENT_STATUSES,
  priority: PRIORITIES,
}

const PROJECT_INTENTS: Record<ProjectStatus, BadgeProps['intent']> = {
  lead: 'outline',
  discussion: 'info',
  planning: 'secondary',
  in_progress: 'primary',
  testing: 'info',
  client_review: 'warning',
  completed: 'success',
  on_hold: 'warning',
  cancelled: 'danger',
}

const TASK_INTENTS: Record<TaskStatus, BadgeProps['intent']> = {
  backlog: 'outline',
  todo: 'secondary',
  in_progress: 'primary',
  in_review: 'info',
  blocked: 'danger',
  done: 'success',
  cancelled: 'danger',
}

const INVOICE_INTENTS: Record<InvoiceStatus, BadgeProps['intent']> = {
  draft: 'outline',
  pending: 'warning',
  sent: 'info',
  client_marked_paid: 'info',
  under_review: 'warning',
  verified: 'success',
  rejected: 'danger',
  disputed: 'danger',
  overdue: 'danger',
}

const PAYMENT_INTENTS: Record<PaymentStatus, BadgeProps['intent']> = {
  pending: 'warning',
  client_marked_paid: 'info',
  under_review: 'warning',
  verified: 'success',
  rejected: 'danger',
  disputed: 'danger',
}

const CLIENT_INTENTS: Record<ClientStatus, BadgeProps['intent']> = {
  lead: 'info',
  active: 'success',
  inactive: 'secondary',
  archived: 'outline',
}

const PRIORITY_INTENTS: Record<PriorityLevel, BadgeProps['intent']> = {
  low: 'outline',
  medium: 'secondary',
  high: 'warning',
  urgent: 'danger',
}

const INTENT_MAP: Record<StatusType, Record<string, BadgeProps['intent']>> = {
  project: PROJECT_INTENTS,
  task: TASK_INTENTS,
  invoice: INVOICE_INTENTS,
  payment: PAYMENT_INTENTS,
  client: CLIENT_INTENTS,
  priority: PRIORITY_INTENTS,
}

function getStatusLabel(type: StatusType, status: string): string {
  const match = STATUS_LABELS[type].find((item) => item.value === status)
  return match?.label ?? status.replace(/_/g, ' ')
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'intent'> {
  type: StatusType
  status: StatusValue
  label?: string
}

export function StatusBadge({ type, status, label, className, ...props }: StatusBadgeProps) {
  const intent = INTENT_MAP[type][status] ?? 'outline'
  const displayLabel = label ?? getStatusLabel(type, status)

  return (
    <Badge intent={intent} isCircle={false} className={className} {...props}>
      {displayLabel}
    </Badge>
  )
}
