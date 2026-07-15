'use client'

import { twMerge } from 'tailwind-merge'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onPress?: ButtonProps['onPress']
    intent?: ButtonProps['intent']
    href?: string
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={twMerge(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-16 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-fg [&_svg]:size-5">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-fg text-sm/6">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-pretty text-muted-fg text-sm/6">{description}</p>
      )}
      {action && (
        <Button
          className="mt-6"
          intent={action.intent ?? 'outline'}
          size="sm"
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
