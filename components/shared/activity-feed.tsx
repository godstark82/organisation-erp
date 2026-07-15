import { formatDistanceToNow } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import type { ActivityLog, Profile } from '@/types'
import { UserAvatar } from '@/components/shared/user-avatar'

export interface ActivityItem {
  id: string
  actor?: Profile | null
  text: React.ReactNode
  timestamp: string
}

export interface ActivityFeedProps extends React.HTMLAttributes<HTMLUListElement> {
  items: ActivityItem[] | ActivityLog[]
  emptyMessage?: string
}

function formatActivityText(item: ActivityLog): React.ReactNode {
  const actorName = item.actor?.full_name ?? 'Someone'
  const entity = item.entity_label ? ` ${item.entity_label}` : ''
  return (
    <>
      <span className="font-medium text-fg">{actorName}</span>{' '}
      <span className="text-muted-fg">{item.action.replace(/_/g, ' ')}</span>
      {entity && <span className="text-fg">{entity}</span>}
    </>
  )
}

function normalizeItems(items: ActivityItem[] | ActivityLog[]): ActivityItem[] {
  if (items.length === 0) return []
  const first = items[0]
  if ('action' in first) {
    return (items as ActivityLog[]).map((item) => ({
      id: item.id,
      actor: item.actor,
      text: formatActivityText(item),
      timestamp: item.created_at,
    }))
  }
  return items as ActivityItem[]
}

export function ActivityFeed({
  items,
  emptyMessage = 'No activity yet',
  className,
  ...props
}: ActivityFeedProps) {
  const normalized = normalizeItems(items)

  if (normalized.length === 0) {
    return (
      <p className="py-8 text-center text-muted-fg text-sm/6" data-slot="activity-feed-empty">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul
      data-slot="activity-feed"
      className={twMerge('divide-y divide-border', className)}
      {...props}
    >
      {normalized.map((item) => (
        <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <UserAvatar profile={item.actor ?? undefined} size="sm" className="mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-pretty text-sm/6">{item.text}</p>
            <time
              className="text-muted-fg text-xs/5 tabular-nums"
              dateTime={item.timestamp}
              title={new Date(item.timestamp).toLocaleString()}
            >
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </time>
          </div>
        </li>
      ))}
    </ul>
  )
}
