"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type { DataTableResizeOptions } from "@adscrush/shared/types/data-table"

interface DataTableAdvancedFilterToolbarProps<TData> {
  table: Table<TData>
  resizing?: DataTableResizeOptions
  shallow?: boolean
  debounceMs?: number
  throttleMs?: number
  children?: React.ReactNode
}

/**
 * Eliminates the ~40-line boilerplate block that appears in every data table
 * for the advanced filter toolbar vs simple toolbar conditional rendering.
 *
 * Usage:
 * ```tsx
 * <DataTableAdvancedFilterToolbar table={table} resizing={resizing} />
 * ```
 *
 * Instead of:
 * ```tsx
 * {enableAdvancedFilter ? (
 *   <DataTableAdvancedToolbar ...>
 *     <DataTableSortList ... />
 *     {filterFlag === "advancedFilters" ? (
 *       <DataTableFilterList ... />
 *     ) : (
 *       <DataTableFilterMenu ... />
 *     )}
 *   </DataTableAdvancedToolbar>
 * ) : (
 *   <DataTableToolbar ...>
 *     <DataTableSortList ... />
 *   </DataTableToolbar>
 * )}
 * ```
 */
export function DataTableAdvancedFilterToolbar<TData>({
  table,
  resizing,
  shallow,
  debounceMs,
  throttleMs,
  children,
}: DataTableAdvancedFilterToolbarProps<TData>) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags()

  if (enableAdvancedFilter) {
    return (
      <DataTableAdvancedToolbar table={table} resizing={resizing}>
        <DataTableSortList table={table} align="start" />
        {filterFlag === "advancedFilters" ? (
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        ) : (
          <DataTableFilterMenu
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
          />
        )}
        {children}
      </DataTableAdvancedToolbar>
    )
  }

  return (
    <DataTableToolbar table={table} resizing={resizing}>
      <DataTableSortList table={table} align="end" />
      {children}
    </DataTableToolbar>
  )
}
