"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CheckIcon } from "@heroicons/react/20/solid"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent } from "@/components/ui/popover"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions"
import { formatRelative } from "@/lib/utils"
import type { Notification } from "@/types"

interface NotificationsPanelProps {
  children: React.ReactNode
  notifications: Notification[]
  unreadCount?: number
}

export function NotificationsPanel({
  children,
  notifications,
  unreadCount = 0,
}: NotificationsPanelProps) {
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

  return (
    <Popover>
      {children}
      <PopoverContent
        placement="bottom end"
        className="w-[min(20rem,calc(100vw-2rem))] p-0 [--gutter:--spacing(0)]"
        offset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-medium text-sm">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-muted-fg text-xs">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              intent="plain"
              size="xs"
              onPress={markAllRead}
              isDisabled={isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <li className="px-4 py-6 text-center text-muted-fg text-sm">
              No notifications
            </li>
          ) : (
            notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  disabled={isPending}
                  className="flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60 disabled:opacity-50"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      !item.is_read ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-sm">{item.title}</span>
                      <span className="shrink-0 text-muted-fg text-xs">
                        {formatRelative(item.created_at)}
                      </span>
                    </span>
                    {item.body && (
                      <span className="mt-0.5 line-clamp-2 text-muted-fg text-xs">
                        {item.body}
                      </span>
                    )}
                  </span>
                  {item.is_read && (
                    <CheckIcon className="mt-1 size-4 shrink-0 text-muted-fg" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="border-t px-4 py-2.5">
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 font-medium text-muted-fg text-sm no-underline transition hover:bg-secondary hover:text-fg"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
