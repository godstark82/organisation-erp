import { twMerge } from 'tailwind-merge'
import { Heading } from '@/components/ui/heading'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  sticky?: boolean
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  sticky = false,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={twMerge(
        'flex flex-col gap-4 border-b border-border pb-6',
        sticky && 'sticky top-14 z-20 -mx-4 bg-bg/80 px-4 pt-1 backdrop-blur-md sm:-mx-6 sm:px-6',
        className
      )}
      {...props}
    >
      {breadcrumbs && <div className="min-h-5">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Heading level={1}>{title}</Heading>
          {description && (
            <p className="max-w-2xl text-pretty text-muted-fg text-sm/6">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
