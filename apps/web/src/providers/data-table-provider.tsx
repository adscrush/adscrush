"use client"

import { useTableColumnResize } from "@/components/data-table/hooks/use-table-column-resize"
import {
  cleanupColumnResizing,
  initializeColumnSizes,
  trackColumnResizing,
} from "@/components/data-table/utils/column-sizing"
import { useIsomorphicLayoutEffect } from "@adscrush/ui/hooks/use-isomorphic-layout-effect"
import { type DataTableResizeOptions } from "@adscrush/shared/types/data-table"
import { type ColumnDef, type Table } from "@tanstack/react-table"
import React from "react"

interface DataTableProviderProps<TData> {
  children: React.ReactNode
  table: Table<TData>
  resizing?: DataTableResizeOptions
}

export function DataTableProvider<TData>({
  children,
  table,
  resizing,
}: DataTableProviderProps<TData>) {
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  )
  const tableId = resizing?.tableId ?? "data-table-default"
  const { setColumnSizing } = useTableColumnResize(
    tableId,
    resizing?.enableColumnResizing ?? false
  )
  useIsomorphicLayoutEffect(() => {
    initializeColumnSizes(
      columns as ColumnDef<TData, unknown>[],
      tableId,
      setColumnSizing
    )
  }, [columns, tableId, setColumnSizing])

  React.useEffect(() => {
    const isResizingAny = table
      .getHeaderGroups()
      .some((headerGroup) =>
        headerGroup.headers.some((header) => header.column.getIsResizing())
      )

    trackColumnResizing(isResizingAny)

    // Cleanup on unmount
    return () => {
      cleanupColumnResizing()
    }
  }, [table])

  return <>{children}</>
}
