'use client'

import { FunnelIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/button'
import { SearchField, SearchInput } from '@/components/ui/search-field'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onClear?: () => void
  hasActiveFilters?: boolean
  filters?: React.ReactNode
  actions?: React.ReactNode
  /** Collapse filter controls behind a toggle on small screens */
  collapsibleFilters?: boolean
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  onClear,
  hasActiveFilters = false,
  filters,
  actions,
  collapsibleFilters = false,
  className,
  children,
  ...props
}: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const showClear = hasActiveFilters || Boolean(searchValue)

  return (
    <div
      data-slot="filter-bar"
      className={twMerge(
        'rounded-xl border border-border bg-muted/20 p-3 sm:p-4',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-3">
        {(onSearchChange || showClear || actions || (collapsibleFilters && filters)) && (
          <div className="flex flex-wrap items-center gap-2">
            {onSearchChange && (
              <SearchField
                className="min-w-0 flex-1 basis-48 sm:max-w-sm"
                value={searchValue}
                onChange={onSearchChange}
              >
                <SearchInput placeholder={searchPlaceholder} className="h-9 py-0 sm:h-9" />
              </SearchField>
            )}

            <div className="ms-auto flex shrink-0 items-center gap-2">
              {collapsibleFilters && filters && (
                <Button
                  intent={filtersOpen || hasActiveFilters ? 'secondary' : 'outline'}
                  size="sm"
                  className="lg:hidden"
                  onPress={() => setFiltersOpen((open) => !open)}
                >
                  <FunnelIcon />
                  Filters
                </Button>
              )}
              {showClear && onClear && (
                <Button intent="plain" size="sm" onPress={onClear}>
                  <XMarkIcon />
                  Clear
                </Button>
              )}
              {actions}
            </div>
          </div>
        )}

        {filters && (
          <div
            className={twMerge(
              'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
              collapsibleFilters && !filtersOpen && 'hidden lg:grid'
            )}
          >
            {filters}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
