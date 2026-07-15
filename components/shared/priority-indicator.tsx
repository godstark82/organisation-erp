import { twMerge } from 'tailwind-merge'
import type { PriorityLevel } from '@/types'

const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; dotClass: string; barClass: string }
> = {
  low: {
    label: 'Low',
    dotClass: 'bg-muted-fg/40',
    barClass: 'bg-muted-fg/30',
  },
  medium: {
    label: 'Medium',
    dotClass: 'bg-info-subtle-fg/70',
    barClass: 'bg-info-subtle-fg/50',
  },
  high: {
    label: 'High',
    dotClass: 'bg-warning-subtle-fg',
    barClass: 'bg-warning-subtle-fg/80',
  },
  urgent: {
    label: 'Urgent',
    dotClass: 'bg-danger-subtle-fg',
    barClass: 'bg-danger-subtle-fg/80',
  },
}

export interface PriorityIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: PriorityLevel
  showLabel?: boolean
  variant?: 'dot' | 'bar'
}

export function PriorityIndicator({
  priority,
  showLabel = false,
  variant = 'dot',
  className,
  ...props
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority]

  return (
    <span
      data-slot="priority-indicator"
      data-priority={priority}
      className={twMerge('inline-flex items-center gap-1.5', className)}
      title={config.label}
      {...props}
    >
      {variant === 'dot' ? (
        <span className={twMerge('size-2 shrink-0 rounded-full', config.dotClass)} />
      ) : (
        <span className="flex h-3.5 w-4 shrink-0 items-end gap-px">
          <span className={twMerge('h-1.5 w-1 rounded-xs', config.barClass)} />
          <span
            className={twMerge(
              'w-1 rounded-xs',
              priority === 'low' ? 'h-2 bg-muted-fg/20' : config.barClass,
              priority === 'medium' ? 'h-2.5' : 'h-3'
            )}
          />
          <span
            className={twMerge(
              'w-1 rounded-xs',
              priority === 'low' || priority === 'medium'
                ? 'h-2 bg-muted-fg/20'
                : config.barClass,
              priority === 'high' ? 'h-3' : priority === 'urgent' ? 'h-3.5' : 'h-2'
            )}
          />
        </span>
      )}
      {showLabel && <span className="text-muted-fg text-xs/5">{config.label}</span>}
    </span>
  )
}
