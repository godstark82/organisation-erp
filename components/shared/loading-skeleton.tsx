import { twMerge } from 'tailwind-merge'
import { Skeleton } from '@/components/ui/skeleton'

export type LoadingSkeletonVariant = 'page' | 'table' | 'card' | 'kanban'

export interface LoadingSkeletonProps extends React.ComponentProps<'div'> {
  variant?: LoadingSkeletonVariant
  rows?: number
  columns?: number
}

function Block({ className }: { className?: string }) {
  return <div className={twMerge('h-4 rounded-md bg-secondary', className)} />
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border pb-6">
        <Block className="h-3 w-32" />
        <Block className="h-7 w-64" />
        <Block className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-border p-5">
            <Block className="h-3 w-20" />
            <Block className="h-8 w-24" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg border border-border p-5">
        <Block className="h-5 w-40" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Block key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex gap-4 border-b border-border pb-3">
        <Block className="h-4 w-32" />
        <Block className="h-4 w-24" />
        <Block className="h-4 w-20" />
        <Block className="ml-auto h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-2">
          <Block className="size-8 rounded-full" />
          <Block className="h-4 w-40" />
          <Block className="h-4 w-24" />
          <Block className="h-5 w-16 rounded-full" />
          <Block className="ml-auto h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <Block className="h-5 w-36" />
        <Block className="size-8 rounded-lg" />
      </div>
      <Block className="h-4 w-full" />
      <Block className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Block className="h-8 w-20 rounded-lg" />
        <Block className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

function KanbanSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <div key={columnIndex} className="space-y-3 rounded-lg bg-muted/40 p-3">
          <div className="flex items-center justify-between px-1">
            <Block className="h-4 w-24" />
            <Block className="size-5 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div key={cardIndex} className="space-y-2 rounded-lg border border-border bg-card p-3">
              <Block className="h-4 w-full" />
              <Block className="h-3 w-2/3" />
              <div className="flex items-center gap-2 pt-1">
                <Block className="size-6 rounded-full" />
                <Block className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({
  variant = 'page',
  rows = 6,
  columns = 4,
  className,
  ...props
}: LoadingSkeletonProps) {
  return (
    <Skeleton isLoading className={twMerge('w-full', className)} {...props}>
      {variant === 'page' && <PageSkeleton />}
      {variant === 'table' && <TableSkeleton rows={rows} />}
      {variant === 'card' && <CardSkeleton />}
      {variant === 'kanban' && <KanbanSkeleton columns={columns} />}
    </Skeleton>
  )
}
