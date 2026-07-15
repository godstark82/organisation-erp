"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CheckIcon } from "@heroicons/react/20/solid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions"
import { formatRelative } from "@/lib/utils"
import type { Notification } from "@/types"

interface NotificationsListProps {
  notifications: Notification[]
  showMarkAll?: boolean
}

export function NotificationsList({
  notifications,
  showMarkAll = true,
}: NotificationsListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction()
      router.refresh()
    })
  }

  function openNotification(notification: Notification) {
    startTransition(async () => {
      if (!notification.is_read) {
        await markNotificationReadAction(notification.id)
      }
      if (notification.link) {
        router.push(notification.link)
      } else {
        router.refresh()
      }
    })
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div>
      {showMarkAll && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-fg text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
          {unreadCount > 0 && (
            <Button
              intent="plain"
              size="sm"
              onPress={markAllRead}
              isDisabled={isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
      )}

      {notifications.length === 0 ? (
        <p className="py-12 text-center text-muted-fg text-sm">
          No notifications yet
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openNotification(item)}
                disabled={isPending}
                className="flex w-full gap-3 px-4 py-4 text-start transition-colors hover:bg-muted/40 disabled:opacity-50"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    !item.is_read ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{item.title}</span>
                    <Badge intent="secondary" className="text-[10px] capitalize">
                      {item.type.replace(/_/g, " ")}
                    </Badge>
                    <span className="ms-auto shrink-0 text-muted-fg text-xs">
                      {formatRelative(item.created_at)}
                    </span>
                  </span>
                  {item.body && (
                    <span className="mt-1 line-clamp-2 text-muted-fg text-sm">
                      {item.body}
                    </span>
                  )}
                </span>
                {item.is_read && (
                  <CheckIcon className="mt-1 size-4 shrink-0 text-muted-fg" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
