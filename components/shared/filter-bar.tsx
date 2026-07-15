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
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 w-full flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex w-full items-center gap-2 lg:max-w-xs lg:shrink-0">
          {onSearchChange && (
            <SearchField
              className="min-w-0 flex-1"
              value={searchValue}
              onChange={onSearchChange}
            >
              <SearchInput placeholder={searchPlaceholder} />
            </SearchField>
          )}
          {collapsibleFilters && filters && (
            <Button
              intent={filtersOpen || hasActiveFilters ? 'secondary' : 'outline'}
              size="sm"
              className="shrink-0 lg:hidden"
              onPress={() => setFiltersOpen((open) => !open)}
            >
              <FunnelIcon />
              Filters
            </Button>
          )}
        </div>
        {filters && (
          <div
            className={twMerge(
              'flex flex-wrap items-center gap-2',
              collapsibleFilters && !filtersOpen && 'hidden lg:flex'
            )}
          >
            {filters}
          </div>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {showClear && onClear && (
          <Button intent="plain" size="sm" onPress={onClear}>
            <XMarkIcon />
            Clear
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
