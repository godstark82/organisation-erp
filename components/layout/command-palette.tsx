"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  CommandMenu,
  CommandMenuDescription,
  CommandMenuFooter,
  CommandMenuItem,
  CommandMenuLabel,
  CommandMenuList,
  CommandMenuSearch,
  CommandMenuSection,
  CommandMenuShortcut,
} from "@/components/ui/command-menu"
import { useDebounce } from "@/hooks/use-debounce"
import type { SearchResult } from "@/lib/repositories/search.repository"
import { NAV_SECTIONS } from "./app-sidebar"

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  client: "Client",
  project: "Project",
  payment: "Payment",
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 250)

  const navItems = useMemo(
    () =>
      NAV_SECTIONS.flatMap((section) =>
        section.items.map((item) => ({
          id: item.href,
          label: item.label,
          href: item.href,
          section: "Navigation",
        }))
      ),
    []
  )

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navItems
    const q = query.toLowerCase()
    return navItems.filter((item) => item.label.toLowerCase().includes(q))
  }, [navItems, query])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data: { results?: SearchResult[] }) => {
        if (!cancelled) {
          setSearchResults(data.results ?? [])
          setIsSearching(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([])
          setIsSearching(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  function navigate(href: string) {
    onOpenChange(false)
    setQuery("")
    setSearchResults([])
    router.push(href)
  }

  return (
    <CommandMenu
      isOpen={open}
      onOpenChange={onOpenChange}
      shortcut="k"
      aria-label="Command palette"
      inputValue={query}
      onInputChange={setQuery}
    >
      <CommandMenuSearch placeholder="Search pages, projects, clients…" />
      <CommandMenuList
        aria-label="Command results"
        onAction={(key) => {
          const href = String(key)
          if (href.startsWith("/")) navigate(href)
        }}
      >
        {filteredNav.length > 0 && (
          <CommandMenuSection label="Navigation">
            {filteredNav.map((item) => (
              <CommandMenuItem key={item.id} id={item.href} textValue={item.label}>
                <CommandMenuLabel>{item.label}</CommandMenuLabel>
                <CommandMenuShortcut>G then {item.label[0]?.toUpperCase()}</CommandMenuShortcut>
              </CommandMenuItem>
            ))}
          </CommandMenuSection>
        )}

        {debouncedQuery.trim() && (
          <CommandMenuSection label={isSearching ? "Searching…" : "Search results"}>
            {searchResults.length === 0 && !isSearching ? (
              <CommandMenuItem id="no-results" isDisabled textValue="No results">
                <CommandMenuLabel>No results for &ldquo;{debouncedQuery}&rdquo;</CommandMenuLabel>
              </CommandMenuItem>
            ) : (
              searchResults.map((item) => (
                <CommandMenuItem
                  key={`${item.type}-${item.id}`}
                  id={item.link}
                  textValue={`${item.title} ${item.subtitle ?? ""}`}
                >
                  <CommandMenuLabel>{item.title}</CommandMenuLabel>
                  <CommandMenuDescription>
                    {TYPE_LABELS[item.type]}
                    {item.subtitle ? ` · ${item.subtitle}` : ""}
                  </CommandMenuDescription>
                </CommandMenuItem>
              ))
            )}
          </CommandMenuSection>
        )}
      </CommandMenuList>
      <CommandMenuFooter>
        <span>
          Navigate with <kbd>↑</kbd> <kbd>↓</kbd>
        </span>
        <span>
          Open with <kbd>↵</kbd>
        </span>
        <span>
          Close with <kbd>Esc</kbd>
        </span>
      </CommandMenuFooter>
    </CommandMenu>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
