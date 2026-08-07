"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adscrush/ui/components/popover"
import type { Table } from "@tanstack/react-table"
import { EyeOff, Settings, Undo2, X } from "lucide-react"
import * as React from "react"
import { useTableColumnResize } from "./hooks/use-table-column-resize"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"
import { parseAsStringEnum, useQueryState } from "nuqs"

interface DataTableSettingsOptionsProps<TData> extends React.ComponentProps<
  typeof PopoverContent
> {
  table: Table<TData>
  resizing?: {
    tableId: string
    enableColumnResizing: boolean
  }
}

export function DataTableSettingsOptions<TData>({
  table,
  resizing,
  ...props
}: DataTableSettingsOptionsProps<TData>) {
  const { resetColumnSizing } = useTableColumnResize(
    resizing?.tableId ?? "",
    resizing?.enableColumnResizing ?? false
  )
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  )

  const [, setFilters] = useQueryState(
    table.options.meta?.queryKeys?.filters ?? "filters",
    getFiltersStateParser<TData>(columns.map((field) => field.id))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        shallow: false,
      })
  )

  const [, setJoinOperator] = useQueryState(
    table.options.meta?.queryKeys?.joinOperator ?? "",
    parseAsStringEnum(["and", "or"]).withDefault("and").withOptions({
      clearOnDefault: true,
      shallow: false,
    })
  )

  const onFiltersReset = React.useCallback(() => {
    void setFilters(null)
    void setJoinOperator("and")
  }, [setFilters, setJoinOperator])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden font-normal lg:flex"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open table settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" {...props}>
        <div className="space-y-2">
          <h4 className="leading-none font-medium">Table Settings</h4>
        </div>

        <div className="mt-0 grid gap-2">
          {resizing?.enableColumnResizing && (
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={(e) => {
                e.preventDefault()
                // Reset the table's column sizing state (visual reset)
                table.resetColumnSizing()
                // Reset localStorage (persistence reset)
                resetColumnSizing()
              }}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Reset Column Sizes
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={onFiltersReset}
          >
            <X className="mr-2 h-4 w-4" />
            Reset filters
          </Button>

          {!table.getIsAllColumnsVisible() && (
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => table.resetColumnVisibility()}
            >
              <EyeOff className="mr-2 h-4 w-4" />
              Show All Columns
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
