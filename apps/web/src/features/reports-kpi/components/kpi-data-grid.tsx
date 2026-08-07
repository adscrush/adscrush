"use client"

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table"
import { arrayMove } from "@dnd-kit/sortable"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@adscrush/ui/components/reui/data-grid"
import { DataGridTableDnd } from "@adscrush/ui/components/reui/data-grid/data-grid-table-dnd"
import { ScrollArea, ScrollBar } from "@adscrush/ui/components/scroll-area"
import { trpc } from "@/lib/trpc/client"
import { formatCurrency, formatPercent } from "../utils"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import { Input } from "@adscrush/ui/components/input"
import { Button } from "@adscrush/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { Search, AlertCircle, Download, Settings2 } from "lucide-react"
import { CalendarDatePicker, type CalendarTime } from "@adscrush/ui/components/calendar-date-picker"
import { startOfDay, endOfDay, format } from "date-fns"
import type { KpiRow, GroupByValue } from "./kpi-data-grid-columns"
export type { KpiRow, GroupByValue } from "./kpi-data-grid-columns"
import {
  MIN_COLUMN_WIDTH,
  HIDDEN_ATTRIBUTE_COLUMN_IDS,
  FILTER_ONLY_COLUMN_IDS,
  BASE_COLUMN_IDS,
  AD_ACCOUNT_COLUMN_IDS,
  PRODUCT_COLUMN_IDS,
  loadColumnWidths,
  saveColumnWidths,
  buildKpiColumns,
} from "./kpi-data-grid-columns"

export interface KpiDataGridProps {
  data: KpiRow[]
  isLoading: boolean
  activeTab: GroupByValue
  totalCount: number
  pageCount: number
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  columnVisibility: VisibilityState
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  /** Active breakdown dimension IDs (e.g. ["campaign", "country"]). */
  breakdownBy?: string[]
  search?: string
  onSearchChange?: (value: string) => void
  dateFrom?: string | null
  dateTo?: string | null
  onDateChange?: (dateFrom: string | null, dateTo: string | null) => void
  error?: { message?: string } | null
  onRetry?: () => void
  onExport?: () => void
  isExporting?: boolean
  allColumns?: { id: string; label: string }[]
}

export function KpiDataGrid({
  data,
  isLoading,
  activeTab,
  totalCount,
  pageCount,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  breakdownBy = [],
  search = "",
  onSearchChange,
  dateFrom = null,
  dateTo = null,
  onDateChange,
  error,
  onRetry,
  onExport,
  isExporting = false,
  allColumns = [],
}: KpiDataGridProps) {
  // Fetch product images when the product tab is active.
  const productIds = useMemo(() => {
    if (activeTab !== "product") return []
    const ids = new Set<string>()
    for (const row of data) {
      if (row.id) {
        const productId = row.id.split("::")[0]
        if (productId) ids.add(productId)
      }
    }
    return [...ids]
  }, [activeTab, data])

  const { data: productData } = trpc.products.search.useQuery(
    { ids: productIds, limit: productIds.length },
    { enabled: productIds.length > 0, staleTime: 5 * 60 * 1000 }
  )

  const productImageMap = useMemo(() => {
    if (!productData) return new Map<string, string | null>()
    return new Map(productData.map((p) => [p.id, p.image ?? null]))
  }, [productData])

  // Build column IDs based on active breakdowns
  const columnIds = useMemo(() => {
    const ids = [...BASE_COLUMN_IDS, ...PRODUCT_COLUMN_IDS, ...AD_ACCOUNT_COLUMN_IDS]
    for (const field of breakdownBy) {
      ids.push(`${field}Name`)
    }
    return [...ids, ...FILTER_ONLY_COLUMN_IDS, ...HIDDEN_ATTRIBUTE_COLUMN_IDS]
  }, [breakdownBy])

  // Build columns using the extracted builder
  const columns = useMemo(
    () => buildKpiColumns(activeTab, productImageMap, breakdownBy),
    [activeTab, productImageMap, breakdownBy],
  )

  // State: column order, pinning, sizing, visibility
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(columnIds)
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: ["name"], right: [] })
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => loadColumnWidths())

  // Time tracking for date picker
  const startTimeRef = useRef<CalendarTime>({ hours: 0, minutes: 0, seconds: 0 })
  const endTimeRef = useRef<CalendarTime>({ hours: 23, minutes: 59, seconds: 59 })
  const selectedDatesRef = useRef<{ from: Date; to: Date }>({
    from: dateFrom ? new Date(dateFrom) : startOfDay(new Date()),
    to: dateTo ? new Date(dateTo) : endOfDay(new Date()),
  })

  const parseTimeFromStr = (str: string | null, def: CalendarTime): CalendarTime => {
    if (!str) return def
    const d = new Date(str)
    if (isNaN(d.getTime())) return def
    return { hours: d.getHours(), minutes: d.getMinutes(), seconds: d.getSeconds() }
  }

  const initialStartTime = useMemo(() => parseTimeFromStr(dateFrom, { hours: 0, minutes: 0, seconds: 0 }), [dateFrom])
  const initialEndTime = useMemo(() => parseTimeFromStr(dateTo, { hours: 23, minutes: 59, seconds: 59 }), [dateTo])

  useEffect(() => { startTimeRef.current = initialStartTime }, [initialStartTime])
  useEffect(() => { endTimeRef.current = initialEndTime }, [initialEndTime])
  useEffect(() => {
    selectedDatesRef.current = {
      from: dateFrom ? new Date(dateFrom) : startOfDay(new Date()),
      to: dateTo ? new Date(dateTo) : endOfDay(new Date()),
    }
  }, [dateFrom, dateTo])

  const emitDateTime = useCallback((d: { from: Date; to: Date }) => {
    if (!onDateChange) return
    const fromDate = new Date(d.from)
    const toDate = new Date(d.to)
    fromDate.setHours(startTimeRef.current.hours, startTimeRef.current.minutes, startTimeRef.current.seconds, 0)
    toDate.setHours(endTimeRef.current.hours, endTimeRef.current.minutes, endTimeRef.current.seconds, 0)
    onDateChange(
      format(fromDate, "yyyy-MM-dd'T'HH:mm:ss"),
      format(toDate, "yyyy-MM-dd'T'HH:mm:ss"),
    )
  }, [onDateChange])

  const handleTimeChange = useCallback((start: CalendarTime, end: CalendarTime) => {
    startTimeRef.current = start
    endTimeRef.current = end
    emitDateTime(selectedDatesRef.current)
  }, [emitDateTime])

  const handleDateSelect = useCallback((d: { from: Date; to: Date }) => {
    selectedDatesRef.current = d
    emitDateTime(d)
  }, [emitDateTime])

  // Persist column widths to localStorage
  useEffect(() => {
    if (Object.keys(columnSizing).length > 0) {
      saveColumnWidths(columnSizing)
    }
  }, [columnSizing])

  // Reset column order when tab changes
  useEffect(() => { setColumnOrder(columnIds) }, [columnIds])

  // Column visibility — merge external with hidden-by-default columns
  const columnVisibility = useMemo(() => {
    const filterOnlyHidden = Object.fromEntries(
      [...FILTER_ONLY_COLUMN_IDS, ...HIDDEN_ATTRIBUTE_COLUMN_IDS].map((id) => [id, false]),
    )
    return { ...filterOnlyHidden, ...externalColumnVisibility }
  }, [externalColumnVisibility])

  // Constrained pinning handler (max 3 left, 2 right)
  const handleColumnPinningChange = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      setColumnPinning((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        if ((next.left || []).length > 3 || (next.right || []).length > 2) return prev
        return next
      })
    }, [],
  )

  // Constrained visibility handler (min 2 visible)
  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      const next = typeof updater === "function" ? updater(columnVisibility) : updater
      const hiddenCount = Object.values(next).filter((v) => v === false).length
      if (columnIds.length - hiddenCount < 2) return
      externalOnColumnVisibilityChange(next)
    },
    [columnIds, columnVisibility, externalOnColumnVisibilityChange],
  )

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: { columnOrder, columnPinning, columnSizing, columnVisibility, sorting, pagination },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: handleColumnPinningChange,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onSortingChange: (updater) => onSortingChange(typeof updater === "function" ? updater(sorting) : updater),
    onPaginationChange: (updater) => onPaginationChange(typeof updater === "function" ? updater(pagination) : updater),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableSorting: true,
    defaultColumn: { minSize: MIN_COLUMN_WIDTH },
  })

  // DnD column reorder
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!active || !over || active.id === over.id) return
      const getPinGroup = (colId: string): "left" | "right" | "center" => {
        if (columnPinning.left?.includes(colId)) return "left"
        if (columnPinning.right?.includes(colId)) return "right"
        return "center"
      }
      if (getPinGroup(active.id as string) === getPinGroup(over.id as string)) {
        setColumnOrder((prev) => {
          const oldIndex = prev.indexOf(active.id as string)
          const newIndex = prev.indexOf(over.id as string)
          return arrayMove(prev, oldIndex, newIndex)
        })
      }
    },
    [columnPinning],
  )

  // Footer totals
  const totals = useMemo(() => {
    const sums = data.reduce(
      (acc, row) => ({
        clicks: acc.clicks + Number(row.clicks || 0),
        uniqueClicks: acc.uniqueClicks + Number(row.uniqueClicks || 0),
        conversions: acc.conversions + Number(row.conversions || 0),
        approvedConversions: acc.approvedConversions + Number(row.approvedConversions || 0),
        revenue: acc.revenue + Number(row.revenue || 0),
        payout: acc.payout + Number(row.payout || 0),
        profit: acc.profit + Number(row.profit || 0),
        spend: acc.spend + Number(row.spend || 0),
      }),
      { clicks: 0, uniqueClicks: 0, conversions: 0, approvedConversions: 0, revenue: 0, payout: 0, profit: 0, spend: 0 },
    )
    return {
      ...sums,
      cr: sums.clicks > 0 ? (sums.conversions / sums.clicks) * 100 : 0,
      rpc: sums.clicks > 0 ? sums.revenue / sums.clicks : 0,
      epc: sums.clicks > 0 ? sums.payout / sums.clicks : 0,
      roas: sums.spend > 0 ? (sums.revenue / sums.spend) * 100 : 0,
    }
  }, [data])

  const footerContent = useMemo(() => {
    const allColumns = [
      ...table.getLeftLeafColumns(),
      ...table.getCenterLeafColumns(),
      ...table.getRightLeafColumns(),
    ].filter((col) => col.getIsVisible())

    return (
      <DataGridTableFootRow>
        {allColumns.map((column) => {
          const colId = column.id
          if (colId === "name") {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="bg-muted/30">
                <span className="text-[11px] font-bold italic opacity-60">Total</span>
              </DataGridTableFootRowCell>
            )
          }
          if (["clicks", "uniqueClicks", "conversions", "approvedConversions"].includes(colId)) {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {(totals[colId as keyof typeof totals] as number).toLocaleString()}
              </DataGridTableFootRowCell>
            )
          }
          if (["revenue", "payout", "profit", "spend"].includes(colId)) {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {formatCurrency(totals[colId as keyof typeof totals] as number)}
              </DataGridTableFootRowCell>
            )
          }
          if (colId === "cr") {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {formatPercent(totals.cr)}
              </DataGridTableFootRowCell>
            )
          }
          if (colId === "rpc") {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {formatCurrency(totals.rpc)}
              </DataGridTableFootRowCell>
            )
          }
          if (colId === "epc") {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {formatCurrency(totals.epc)}
              </DataGridTableFootRowCell>
            )
          }
          if (colId === "roas") {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-right font-mono text-[11px] font-bold tabular-nums">
                {formatPercent(totals.roas)}
              </DataGridTableFootRowCell>
            )
          }
          if (
            colId === "country" || colId === "device" || colId === "browser" ||
            colId.endsWith("Name") || HIDDEN_ATTRIBUTE_COLUMN_IDS.includes(colId) ||
            FILTER_ONLY_COLUMN_IDS.includes(colId)
          ) {
            return (
              <DataGridTableFootRowCell key={colId} column={column} className="text-[11px] italic opacity-50">—</DataGridTableFootRowCell>
            )
          }
          return <DataGridTableFootRowCell key={colId} column={column} />
        })}
      </DataGridTableFootRow>
    )
    // Module-level constants are omitted; `table` already captures the live
    // column state (pinning/visibility/order) on every render.
  }, [table, totals])

  // Column search state for dropdown
  const [columnSearch, setColumnSearch] = useState("")
  const filteredColumns = useMemo(
    () => columnSearch ? allColumns.filter((col) => col.label.toLowerCase().includes(columnSearch.toLowerCase())) : allColumns,
    [allColumns, columnSearch],
  )

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              maxLength={200}
              className="h-7 py-1 pl-9"
            />
          </div>
        )}
        {onDateChange && (
          <CalendarDatePicker
            id="kpi-date-picker"
            date={{
              from: dateFrom ? new Date(dateFrom) : startOfDay(new Date()),
              to: dateTo ? new Date(dateTo) : endOfDay(new Date()),
            }}
            onDateSelect={handleDateSelect}
            onTimeChange={handleTimeChange}
            startTime={initialStartTime}
            endTime={initialEndTime}
            variant="outline"
          />
        )}
        <DataTableFilterMenu
          table={table}
          shallow={false}
          debounceMs={300}
          throttleMs={50}
          renderTrigger={(trigger) => <>{trigger}</>}
        />
        <div className="ml-auto flex items-center gap-2">
          {allColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-2">
                  <Settings2 className="size-3.5" />
                  <span className="text-xs">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
                <div className="border-b px-2 py-1.5">
                  <Input
                    placeholder="Search columns..."
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <DropdownMenuSeparator />
                  {filteredColumns.map((column) => {
                    const isVisible = columnVisibility[column.id] !== false
                    const hiddenCount = Object.values(columnVisibility).filter((v) => v === false).length
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={isVisible}
                        disabled={column.id === "name" || (isVisible && allColumns.length - hiddenCount <= 2)}
                        onCheckedChange={(checked) => {
                          externalOnColumnVisibilityChange({ ...columnVisibility, [column.id]: !!checked })
                        }}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                  {filteredColumns.length === 0 && (
                    <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                      No columns match your search
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-2"
              onClick={onExport}
              disabled={isExporting || data.length === 0}
            >
              <Download className={isExporting ? "size-3.5 animate-spin" : "size-3.5"} />
              <span className="text-xs">Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <AlertCircle className="size-10 text-destructive" />
          <div className="text-center">
            <p className="text-sm font-medium">Unable to load performance data</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message || "An unexpected error occurred."}</p>
          </div>
          {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
        </div>
      )}

      {/* Empty state */}
      {!error && data.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="text-center">
            <p className="text-sm font-medium">No data found</p>
            <p className="text-xs text-muted-foreground mt-1">Try changing the selected date range or filters.</p>
          </div>
        </div>
      )}

      {/* Data table */}
      {!error && (data.length > 0 || isLoading) && (
        <DataGrid
          table={table}
          recordCount={totalCount}
          isLoading={isLoading}
          tableLayout={{
            dense: true,
            rowBorder: true,
            stripped: true,
            headerBorder: true,
            headerSticky: true,
            width: "fixed",
            columnsResizable: true,
            columnsResizeMode: "onChange",
            columnsPinnable: true,
            columnsVisibility: true,
            columnsMovable: true,
            columnsDraggable: true,
          }}
        >
          <DataGridContainer border={false} className="border border-muted/50">
            <ScrollArea>
              <DataGridTableDnd handleDragEnd={handleDragEnd} footerContent={footerContent} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination sizes={[25, 50, 100]} />
        </DataGrid>
      )}
    </div>
  )
}
