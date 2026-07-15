import { LoadingSkeleton } from "@/components/shared/loading-skeleton"

export default function NotificationsLoading() {
  return (
    <div className="p-4 sm:p-6">
      <LoadingSkeleton variant="table" rows={8} />
    </div>
  )
}
