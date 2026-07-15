'use client'

import { FunnelIcon } from '@heroicons/react/20/solid'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/button'
import { SearchField, SearchInput } from '@/components/ui/search-field'
import { Toolbar, ToolbarGroup } from '@/components/ui/toolbar'

export interface DataTableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  selectedCount?: number
  onClearSelection?: () => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  showFilterToggle?: boolean
  onFilterToggle?: () => void
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  selectedCount = 0,
  onClearSelection,
  filters,
  actions,
  showFilterToggle = false,
  onFilterToggle,
  className,
  children,
  ...props
}: DataTableToolbarProps) {
  return (
    <div
      data-slot="data-table-toolbar"
      className={twMerge('flex flex-col gap-3', className)}
      {...props}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onSearchChange && (
            <SearchField
              className="w-full sm:max-w-sm"
              value={searchValue}
              onChange={onSearchChange}
            >
              <SearchInput placeholder={searchPlaceholder} />
            </SearchField>
          )}
          {showFilterToggle && onFilterToggle && (
            <Button intent="outline" size="sm" onPress={onFilterToggle}>
              <FunnelIcon />
              Filters
            </Button>
          )}
        </div>
        <Toolbar className="w-full sm:w-auto">
          <ToolbarGroup className="w-full justify-end sm:w-auto">
            {selectedCount > 0 && (
              <>
                <span className="px-2 text-muted-fg text-sm/6 tabular-nums">
                  {selectedCount} selected
                </span>
                {onClearSelection && (
                  <Button intent="plain" size="sm" onPress={onClearSelection}>
                    Clear
                  </Button>
                )}
              </>
            )}
            {actions}
          </ToolbarGroup>
        </Toolbar>
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {children}
    </div>
  )
}
