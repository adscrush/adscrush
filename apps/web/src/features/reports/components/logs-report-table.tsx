"use client"

import type { LogsReportRow, ReportGroupBy, ReportPeriod, ReportSortBy, ReportTopField } from "../queries"
import { formatCurrency, formatCompactNumber } from "@/features/dashboard/utils"
import { useMemo, useCallback, useState } from "react"
import { Download, RefreshCw, Sparkles, Settings2 } from "lucide-react"
import { Button } from "@adscrush/ui/components/button"
import { useQueryStates } from "nuqs"
import { trpc } from "@/lib/trpc/client"
import { performanceSearchParams } from "../validations"
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type SortingState,
} from "@tanstack/react-table"
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridPagination,
  DataGridColumnHeader,
} from "@adscrush/ui/components/reui/data-grid"
import { ScrollArea, ScrollBar } from "@adscrush/ui/components/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"

/** Label shown for the grouping (dimension) column, per group-by value. */
const groupByLabels: Record<ReportGroupBy, string> = {
  campaign: "Campaign",
  funnel: "Funnel",
  product: "Product",
  media_buyer: "Media Buyer",
  adAccount: "Ad Account",
  advertiser: "Advertiser",
  landing_page: "Landing Page",
  country: "Country",
  source: "Source",
  creative: "Creative",
  deviceType: "Device Type",
  os: "OS",
  browser: "Browser",
  ip: "IP Address",
  daily: "Date",
}

/** Metric columns available in the report (the dimension column is prepended
 *  separately based on the active group-by). */
const metricFields = [
  { id: "clicks", label: "Clicks" },
  { id: "uniqueClicks", label: "Unique IPs" },
  { id: "conversions", label: "Conversions" },
  { id: "cr", label: "Conversion Rate" },
  { id: "revenue", label: "Revenue" },
  { id: "payout", label: "Payout" },
  { id: "profit", label: "Profit" },
] as const

/** Per-group "top value" dimension columns resolved on the server (e.g. the
 *  most frequent device / browser / OS / IP / landing page within each row's
 *  group). Not sortable — they are computed after grouping. */
const dimensionFields = [
  { id: "ip", label: "IP Address" },
  { id: "device", label: "Device" },
  { id: "browser", label: "Browser" },
  { id: "os", label: "OS" },
  { id: "landingPage", label: "Landing Page" },
] as const

const DIMENSION_FIELD_IDS = new Set<string>(dimensionFields.map((f) => f.id))

const NUMERIC_FIELDS = new Set(["clicks", "uniqueClicks", "conversions"])
const CURRENCY_FIELDS = new Set(["revenue", "payout", "profit"])
const RIGHT_ALIGNED = new Set([
  "clicks",
  "uniqueClicks",
  "conversions",
  "cr",
  "revenue",
  "payout",
  "profit",
])

/** Parameters shared by the admin and portal performance-report queries. */
export interface LogsReportQueryParams {
  period: ReportPeriod
  dateFrom?: string
  dateTo?: string
  productId?: string
  groupBy: ReportGroupBy
  sortBy?: ReportSortBy
  sortDir?: "asc" | "desc"
  page?: number
  limit?: number
  topFields?: ReportTopField[]
}

export type UsePerformanceQuery = (params: LogsReportQueryParams) => {
  data?: unknown[]
  isLoading: boolean
  isFetching: boolean
  refetch: () => void
}

interface LogsReportTableProps {
  /** Query hook to use — allows admin and portal to pass different tRPC calls */
  usePerformanceQuery: UsePerformanceQuery
  /** Whether to show the CSV export button (admin-only feature) */
  showExport?: boolean
  /** Whether to show the AI Analyze button (admin-only feature) */
  showAiAnalyze?: boolean
}

export function LogsReportTable({
  usePerformanceQuery,
  showExport = true,
  showAiAnalyze = true,
}: LogsReportTableProps) {
  const [filters, setFilters] = useQueryStates(performanceSearchParams, {
    shallow: false,
  })

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({})
  const [isExporting, setIsExporting] = useState(false)

  const utils = trpc.useUtils()

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const csv = await utils.reports.export.fetch({
        type: "performance",
        period: filters.period,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        productIds: filters.productId ? [filters.productId] : undefined,
        mediaBuyerId: filters.mediaBuyerId || undefined,
        advertiserId: filters.advertiserId || undefined,
        groupBy: filters.groupBy,
      })
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `report-${filters.groupBy}-${filters.period}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }, [utils, filters])

  const groupBy = filters.groupBy as ReportGroupBy
  const dimensionLabel = groupByLabels[groupBy] ?? "Name"

  // Only metric fields are toggleable; the dimension column ("name") is always shown.
  const displayFields = useMemo(
    () => filters.displayFields.split(",").filter(Boolean),
    [filters.displayFields]
  )

  const toggleField = useCallback(
    (field: string) => {
      const fields = filters.displayFields.split(",").filter(Boolean)
      const newFields = fields.includes(field)
        ? fields.filter((f) => f !== field)
        : [...fields, field]
      // Keep the dimension column pinned to the front and always present.
      const withoutName = newFields.filter((f) => f !== "name")
      setFilters({ displayFields: ["name", ...withoutName].join(",") })
    },
    [filters.displayFields, setFilters]
  )

  const activeTopFields = useMemo(
    () => displayFields.filter((f): f is ReportTopField => DIMENSION_FIELD_IDS.has(f)),
    [displayFields]
  )

  const { data, isLoading, refetch, isFetching } = usePerformanceQuery({
    period: filters.period,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    productId: filters.productId || undefined,
    groupBy,
    sortBy: (filters.orderBy || undefined) as ReportSortBy | undefined,
    sortDir: filters.orderDir,
    page: filters.page,
    limit: filters.perPage,
    topFields: activeTopFields,
  })

  const tableData = useMemo(() => (data ?? []) as LogsReportRow[], [data])

  const columnHelper = createColumnHelper<LogsReportRow>()

  // Ensure "name" is always first, followed by the selected metric columns.
  const orderedFields = useMemo(() => {
    const metrics = displayFields.filter((f) => f !== "name")
    return ["name", ...metrics]
  }, [displayFields])

  const columns = useMemo(() => {
    return orderedFields.map((field) => {
      const label =
        field === "name"
          ? dimensionLabel
          : metricFields.find((m) => m.id === field)?.label ??
            dimensionFields.find((d) => d.id === field)?.label ??
            field

      const isDimensionField = DIMENSION_FIELD_IDS.has(field)

      return columnHelper.accessor(field, {
        id: field,
        size: field === "name" ? 220 : isDimensionField ? 150 : 130,
        enableSorting: !isDimensionField,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={label}
            className={RIGHT_ALIGNED.has(field) ? "justify-end" : ""}
          />
        ),
        cell: ({ getValue }) => {
          const value = getValue()
          if (value === null || value === undefined) {
            return <div className="text-muted-foreground opacity-50">-</div>
          }

          if (field === "name") {
            return (
              <span className="truncate text-[11px] leading-tight font-medium text-primary">
                {String(value)}
              </span>
            )
          }
          if (isDimensionField) {
            return (
              <span className={`truncate text-[11px] leading-tight ${field === "ip" ? "font-mono" : ""}`}>
                {String(value)}
              </span>
            )
          }
          if (CURRENCY_FIELDS.has(field)) {
            return (
              <div className="text-right font-mono text-[11px] font-bold">
                {formatCurrency(Number(value))}
              </div>
            )
          }
          if (NUMERIC_FIELDS.has(field)) {
            return (
              <div className="text-right font-mono text-[11px] font-bold">
                {formatCompactNumber(Number(value))}
              </div>
            )
          }
          if (field === "cr") {
            return (
              <div className="text-right font-mono text-[11px] font-bold text-primary">
                {Number(value).toFixed(2)}%
              </div>
            )
          }
          return <div className="text-[11px]">{String(value)}</div>
        },
      })
    })
  }, [orderedFields, dimensionLabel, columnHelper])

  // Server-side sorting wired to URL params.
  const sorting: SortingState = useMemo(
    () => (filters.orderBy ? [{ id: filters.orderBy, desc: filters.orderDir === "desc" }] : []),
    [filters.orderBy, filters.orderDir]
  )

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const first = next[0]
      if (first) {
        setFilters({ orderBy: first.id, orderDir: first.desc ? "desc" : "asc", page: 1 })
      } else {
        setFilters({ orderBy: "clicks", orderDir: "desc", page: 1 })
      }
    },
    [sorting, setFilters]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnOrder,
      columnPinning,
      sorting,
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: -1,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  })

  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, item) => ({
        clicks: acc.clicks + Number(item.clicks || 0),
        uniqueClicks: acc.uniqueClicks + Number(item.uniqueClicks || 0),
        conversions: acc.conversions + Number(item.conversions || 0),
        revenue: acc.revenue + Number(item.revenue || 0),
        payout: acc.payout + Number(item.payout || 0),
        profit: acc.profit + Number(item.profit || 0),
      }),
      { clicks: 0, uniqueClicks: 0, conversions: 0, revenue: 0, payout: 0, profit: 0 }
    )
  }, [tableData])

  return (
    <DataGrid
      table={table}
      recordCount={tableData.length}
      isLoading={isLoading}
      tableLayout={{
        dense: true,
        rowBorder: true,
        stripped: true,
        headerBorder: true,
        headerSticky: true,
        width: "fixed",
        columnsResizable: true,
        columnsPinnable: true,
        columnsVisibility: true,
        columnsResizeMode: "onChange",
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Settings2 className="size-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Metric Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {metricFields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.id}
                    checked={displayFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  >
                    {field.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Dimension Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dimensionFields.map((field) => (
                  <DropdownMenuCheckboxItem
                    key={field.id}
                    checked={displayFields.includes(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  >
                    {field.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {showAiAnalyze && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-none border-primary/20 text-primary hover:bg-primary/5"
              >
                <Sparkles className="size-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">AI Analyze</span>
              </Button>
            </div>
          )}
        </div>

        <DataGridContainer border={false} className="border border-muted/50">
          <ScrollArea>
            <DataGridTable
              footerContent={
                <DataGridTableFootRow>
                  {[...table.getLeftLeafColumns(), ...table.getCenterLeafColumns(), ...table.getRightLeafColumns()].map(
                    (column, i) => {
                      const field = column.id
                      if (i === 0)
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="bg-muted/30">
                            <span className="text-xs italic opacity-50">Total</span>
                          </DataGridTableFootRowCell>
                        )
                      if (field === "clicks")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCompactNumber(totals.clicks)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "uniqueClicks")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCompactNumber(totals.uniqueClicks)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "conversions")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCompactNumber(totals.conversions)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "revenue")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCurrency(totals.revenue)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "payout")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCurrency(totals.payout)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "profit")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums">
                            {formatCurrency(totals.profit)}
                          </DataGridTableFootRowCell>
                        )
                      if (field === "cr")
                        return (
                          <DataGridTableFootRowCell key={field} column={column} className="text-right font-bold tabular-nums text-primary">
                            {totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : "0.00"}%
                          </DataGridTableFootRowCell>
                        )
                      return <DataGridTableFootRowCell key={field} column={column} />
                    }
                  )}
                </DataGridTableFootRow>
              }
            />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 rounded-none border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground transition-all"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Refresh</span>
          </Button>
          <div className="flex items-center gap-2">
            <DataGridPagination />
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-none border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground transition-all"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className={isExporting ? "size-3.5 animate-pulse" : "size-3.5"} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isExporting ? "Exporting…" : "Export All (CSV)"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </DataGrid>
  )
}
