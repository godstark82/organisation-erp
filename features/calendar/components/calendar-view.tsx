"use client"

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDate, formatRelative } from "@/lib/utils"
import type { UnifiedCalendarEvent, UnifiedEventKind } from "../lib/unified-events"

const KIND_STYLES: Record<
  UnifiedEventKind,
  { label: string; intent: "primary" | "secondary" | "warning" | "danger" | "success" }
> = {
  event: { label: "Event", intent: "secondary" },
  meeting: { label: "Meeting", intent: "primary" },
  deadline: { label: "Deadline", intent: "danger" },
  milestone: { label: "Milestone", intent: "success" },
  payment: { label: "Payment", intent: "warning" },
  project_deadline: { label: "Project", intent: "warning" },
}

export interface CalendarViewProps {
  events: UnifiedCalendarEvent[]
}

function eventDateKey(startsAt: string, allDay: boolean) {
  return allDay ? startsAt.slice(0, 10) : format(parseISO(startsAt), "yyyy-MM-dd")
}

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = addDays(startOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }), 41)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>()
    for (const event of events) {
      const key = eventDateKey(event.startsAt, event.allDay)
      const existing = map.get(key) ?? []
      existing.push(event)
      map.set(key, existing)
    }
    return map
  }, [events])

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date())
    return events
      .filter((e) => {
        const date = e.allDay
          ? startOfDay(parseISO(e.startsAt.slice(0, 10)))
          : startOfDay(parseISO(e.startsAt))
        return !isAfter(today, date) || isSameDay(today, date)
      })
      .slice(0, 12)
  }, [events])

  function openEvent(event: UnifiedCalendarEvent) {
    if (event.link) router.push(event.link)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      {/* Upcoming first on mobile */}
      <aside className="min-w-0 space-y-4 xl:order-2">
        <Card className="shadow-sm">
          <CardHeader title="Upcoming" description="Next deadlines, meetings, and due dates" />
          <CardContent className="space-y-1 py-0">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-muted-fg text-sm">
                No upcoming events
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((event) => {
                  const style = KIND_STYLES[event.kind]
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => openEvent(event)}
                        className="flex w-full flex-col gap-1 px-1 py-3 text-start transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge intent={style.intent} className="shrink-0 text-[10px]">
                            {style.label}
                          </Badge>
                        </div>
                        <span className="text-muted-fg text-xs">
                          {event.allDay
                            ? formatDate(event.startsAt)
                            : `${formatDate(event.startsAt)} · ${format(parseISO(event.startsAt), "h:mm a")}`}
                        </span>
                        {event.projectName && (
                          <span className="text-muted-fg text-xs">{event.projectName}</span>
                        )}
                        <span className="text-muted-fg text-xs">
                          {formatRelative(event.startsAt)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="hidden shadow-sm sm:block xl:block">
          <CardHeader title="Legend" />
          <CardContent className="flex flex-wrap gap-2 py-0">
            {Object.entries(KIND_STYLES).map(([kind, style]) => (
              <Badge key={kind} intent={style.intent}>
                {style.label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </aside>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border xl:order-1">
        <div className="flex items-center justify-between border-b border-border px-3 py-3 sm:px-5 sm:py-4">
          <h3 className="font-medium text-fg text-sm/6">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-1">
            <Button
              intent="plain"
              size="sq-sm"
              aria-label="Previous month"
              onPress={() => setCurrentMonth((d) => addDays(startOfMonth(d), -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              intent="plain"
              size="sq-sm"
              aria-label="Next month"
              onPress={() => setCurrentMonth((d) => addDays(endOfMonth(d), 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border text-center text-muted-fg text-[10px] sm:text-xs/5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-2 font-medium">
              <span className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const dayEvents = eventsByDate.get(key) ?? []
            const inMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={key}
                className={`min-h-14 border-b border-r border-border p-1 last:border-r-0 sm:min-h-24 sm:p-1.5 md:min-h-28 ${
                  inMonth ? "bg-bg" : "bg-muted/30"
                }`}
              >
                <span
                  className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] tabular-nums sm:size-6 sm:text-xs/5 ${
                    isToday ? "bg-primary font-medium text-primary-fg" : "text-muted-fg"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-0.5 flex flex-wrap gap-0.5 sm:mt-1 sm:hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      aria-label={event.title}
                      onClick={() => openEvent(event)}
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          event.kind === "meeting"
                            ? "var(--primary)"
                            : event.kind === "deadline"
                              ? "var(--danger)"
                              : event.kind === "milestone"
                                ? "var(--success)"
                                : event.kind === "payment" ||
                                    event.kind === "project_deadline"
                                  ? "var(--warning)"
                                  : "var(--muted-fg)",
                      }}
                    />
                  ))}
                </div>
                <div className="mt-1 hidden space-y-1 sm:block">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => openEvent(event)}
                      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-start text-xs/5 hover:bg-secondary"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            event.kind === "meeting"
                              ? "var(--primary)"
                              : event.kind === "deadline"
                                ? "var(--danger)"
                                : event.kind === "milestone"
                                  ? "var(--success)"
                                  : event.kind === "payment" ||
                                      event.kind === "project_deadline"
                                    ? "var(--warning)"
                                    : "var(--muted-fg)",
                        }}
                      />
                      <span className="truncate">{event.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1 text-muted-fg text-xs/5">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
