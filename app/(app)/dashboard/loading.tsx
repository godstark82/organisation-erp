import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="space-y-3 border-b border-border pb-6">
        <div className="h-3 w-32 rounded-md bg-secondary" />
        <div className="h-7 w-48 rounded-md bg-secondary" />
        <div className="h-4 w-96 max-w-full rounded-md bg-secondary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-border p-5">
            <div className="h-3 w-20 rounded-md bg-secondary" />
            <div className="h-8 w-24 rounded-md bg-secondary" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-80 rounded-lg border border-border bg-secondary/30" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 rounded-lg border border-border bg-secondary/30" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <Skeleton isLoading className="w-full">
      <DashboardSkeleton />
    </Skeleton>
  )
}
