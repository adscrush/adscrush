"use client"

import type { ReactNode } from "react"
import type { Table } from "@tanstack/react-table"
import type { DataTableResizeOptions } from "@adscrush/shared/types/data-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useFeatureFlags } from "@/providers/feature-flags-provider"

interface DataTableToolbarShellProps<TData> {
  table: Table<TData>
  resizing: DataTableResizeOptions
  shallow: boolean
  debounceMs: number
  throttleMs: number
  /** Optional search bar query param name (basic toolbar) */
  searchName?: string
  /** Whether data is currently fetching (basic toolbar search spinner) */
  isFetching?: boolean
  /** Extra content shown on the right side of the advanced toolbar */
  extra?: ReactNode
}

export function DataTableToolbarShell<TData>({
  table,
  resizing,
  shallow,
  debounceMs,
  throttleMs,
  searchName,
  isFetching,
  extra,
}: DataTableToolbarShellProps<TData>) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags()

  if (enableAdvancedFilter) {
    return (
      <DataTableAdvancedToolbar table={table} resizing={resizing} extra={extra}>
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
      </DataTableAdvancedToolbar>
    )
  }

  return (
    <DataTableToolbar table={table} resizing={resizing} isFetching={isFetching} searchName={searchName}>
      <DataTableSortList table={table} align="end" />
    </DataTableToolbar>
  )
}
