import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'
import { Card, CardContent } from '@/components/ui/card'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  delta?: {
    value: number
    label?: string
  }
  icon?: React.ReactNode
}

export function StatCard({ label, value, delta, icon, className, ...props }: StatCardProps) {
  const isPositive = delta && delta.value > 0
  const isNegative = delta && delta.value < 0
  const isNeutral = delta && delta.value === 0

  return (
    <Card
      data-slot="stat-card"
      className={twMerge('shadow-sm transition-shadow hover:shadow-md [--gutter:--spacing(5)]', className)}
      {...props}
    >
      <CardContent className="flex items-start justify-between gap-4 py-0">
        <div className="min-w-0 space-y-2">
          <p className="font-medium text-muted-fg text-xs/5 tracking-wide uppercase">{label}</p>
          <p className="font-display font-semibold text-2xl/8 tracking-tight tabular-nums">{value}</p>
          {delta && (
            <div className="flex items-center gap-1.5 text-xs/5">
              <span
                className={twMerge(
                  'inline-flex items-center gap-0.5 font-medium',
                  isPositive && 'text-success-subtle-fg',
                  isNegative && 'text-danger-subtle-fg',
                  isNeutral && 'text-muted-fg'
                )}
              >
                {isPositive && <ArrowUpIcon className="size-3.5" />}
                {isNegative && <ArrowDownIcon className="size-3.5" />}
                {isPositive && '+'}
                {delta.value}%
              </span>
              {delta.label && <span className="text-muted-fg">{delta.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-fg [&_svg]:size-5">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
