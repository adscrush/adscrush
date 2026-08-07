"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useQueryStates } from "nuqs"
import { trpc } from "@/lib/trpc/client"
import { kpiSearchParams } from "../validations"
import { PageHeader } from "@/components/common/page-header"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { KpiTabBar } from "./kpi-tab-bar"
import { KpiDataGrid, type KpiRow } from "./kpi-data-grid"
import { generateCsv } from "../utils"
import { format } from "date-fns"
import { toast } from "@adscrush/ui/sonner"
import type { SortingState, VisibilityState, PaginationState } from "@tanstack/react-table"

type GroupByValue = "campaign" | "product" | "advertiser" | "mediaBuyer" | "adAccount"

// ── Typed parameter interfaces (replace Record<string, unknown>) ────────

interface PerformanceParams {
  groupBy: string
  period: string
  dateFrom?: string
  dateTo?: string
  page: number
  perPage: number
  search?: string
  sortBy?: string | null
  sortDir?: string | null
  topFields: string[]
  breakdownBy?: string[]
  filters?: unknown[]
  joinOperator: "and" | "or"
}

interface PerformanceCountParams {
  groupBy: string
  period: string
  dateFrom?: string
  dateTo?: string
  search?: string
  breakdownBy?: string[]
  filters?: unknown[]
  joinOperator: "and" | "or"
}

// ── Typed query result interfaces ──────────────────────────────────────

type PerformanceQueryResult = {
  data: KpiRow[] | undefined
  isLoading: boolean
  isFetching: boolean
  error: { message?: string } | null
  refetch: () => void
}

type PerformanceCountQueryResult = {
  data: { total: number } | undefined
}

/** Query hooks configuration for the KPI reports client.
 *  Allows swapping between admin (trpc.reports.*) and portal (trpc.portal.*) backends. */
export interface KpiQueryHooks {
  usePerformanceQuery: (params: PerformanceParams) => PerformanceQueryResult
  usePerformanceCountQuery: (params: PerformanceCountParams) => PerformanceCountQueryResult
}

interface KpiReportsClientProps {
  queryHooks?: KpiQueryHooks
}

/** All dimension columns that can be toggled in the Columns dropdown.
 *  These show additional dimensions alongside the primary groupBy.
 *  Columns that require breakdownBy on the server are marked with `needsBreakdown`.
 *  Columns that match a primary groupBy tab are filtered out at runtime.
 *  NOTE: country, browser, device are NOT listed here — they already exist as
 *  product-tab display columns in PRODUCT_COLUMNS. */
const DIMENSION_COLUMNS: Array<{ id: string; label: string; needsBreakdown?: boolean }> = [
  // Joined dimensions (need breakdownBy on server to get names)
  { id: "campaignName", label: "Campaign", needsBreakdown: true },
  { id: "funnelName", label: "Funnel", needsBreakdown: true },
  { id: "landingPageName", label: "Landing Page (Detail)", needsBreakdown: true },
  { id: "creativeName", label: "Creative", needsBreakdown: true },
  { id: "mediaBuyerName", label: "Media Buyer", needsBreakdown: true },
  { id: "adAccountName", label: "Ad Account", needsBreakdown: true },
  { id: "tidName", label: "Tracking ID / Click ID", needsBreakdown: true },
  // Direct click-level attributes (already in clicks table, use topFields)
  { id: "geoState", label: "Geo State" },
  { id: "geoCity", label: "Geo City" },
  { id: "topBrowser", label: "Top Browser" },
  { id: "topDevice", label: "Top Device" },
  { id: "os", label: "OS" },
  { id: "source", label: "Source" },
  { id: "sourcePlatform", label: "Platform" },
  { id: "ip", label: "IP Address" },
  { id: "osVersion", label: "OS Version" },
  { id: "browserVersion", label: "Browser Version" },
  { id: "deviceVendor", label: "Device Vendor" },
  { id: "deviceModel", label: "Device Model" },
  { id: "referer", label: "Referrer" },
  { id: "utmSource", label: "UTM Source" },
  { id: "utmMedium", label: "UTM Medium" },
  { id: "utmCampaign", label: "UTM Campaign" },
  { id: "utmTerm", label: "UTM Term" },
  { id: "utmContent", label: "UTM Content" },
]

/** Maps a dimension column ID to its breakdownBy value (server-side group dimension). */
const COLUMN_TO_BREAKDOWN: Record<string, string> = {
  campaignName: "campaign",
  funnelName: "funnel",
  landingPageName: "landingPage",
  creativeName: "creative",
  mediaBuyerName: "mediaBuyer",
  adAccountName: "adAccount",
  tidName: "tid",
}

/** Maps a breakdownBy value back to its column ID. */
const BREAKDOWN_TO_COLUMN: Record<string, string> = {
  campaign: "campaignName",
  funnel: "funnelName",
  landingPage: "landingPageName",
  creative: "creativeName",
  mediaBuyer: "mediaBuyerName",
  adAccount: "adAccountName",
  tid: "tidName",
}

/** Maps a groupBy tab value to the dimension column ID it renders as the Name column. */
const TAB_TO_DIMENSION_COLUMN: Record<string, string> = {
  campaign: "campaignName",
  product: "",        // product is shown via image/avatar in Name column
  mediaBuyer: "mediaBuyerName",
  adAccount: "adAccountName",
  advertiser: "",     // advertiser has no dedicated dimension column
}

const ALL_COLUMNS = [
  { id: "name", label: "Name" },
  { id: "clicks", label: "Clicks" },
  { id: "uniqueClicks", label: "Unique Clicks" },
  { id: "conversions", label: "Conversions" },
  { id: "approvedConversions", label: "Approved Conversions" },
  { id: "revenue", label: "Revenue" },
  { id: "payout", label: "Payout" },
  { id: "profit", label: "Profit" },
  { id: "cr", label: "CR (%)" },
  { id: "rpc", label: "RPC" },
  { id: "epc", label: "EPC" },
]

const AD_ACCOUNT_COLUMNS = [
  { id: "spend", label: "Spend" },
  { id: "roas", label: "ROAS (%)" },
]

const PRODUCT_COLUMNS = [
  { id: "country", label: "Country" },
  { id: "device", label: "Device" },
  { id: "browser", label: "Browser" },
]

/** Map from column IDs to their corresponding server-side topField names.
 *  Only dimensions and product display columns are included — metric columns
 *  (clicks, conversions, revenue, etc.) are always returned by the server. */
const COLUMN_TO_TOP_FIELD: Record<string, string> = {
  "ip": "ip",
  "geoState": "geoState",
  "geoCity": "geoCity",
  "topBrowser": "browser",
  "topDevice": "device",
  "os": "os",
  "source": "source",
  "sourcePlatform": "sourcePlatform",
  "osVersion": "osVersion",
  "browserVersion": "browserVersion",
  "deviceVendor": "deviceVendor",
  "deviceModel": "deviceModel",
  "referer": "referer",
  "utmSource": "utmSource",
  "utmMedium": "utmMedium",
  "utmCampaign": "utmCampaign",
  "utmTerm": "utmTerm",
  "utmContent": "utmContent",
  "creativeName": "creativeName",
  "country": "country",
  "device": "device",
  "browser": "browser",
}

export function KpiReportsClient({ queryHooks }: KpiReportsClientProps = {}) {
  const [params, setParams] = useQueryStates(kpiSearchParams, {
    shallow: false,
  })

  // Determine which query hooks to use — default to admin (trpc.reports.*) or use provided portal hooks
  const usePerformanceQuery = queryHooks?.usePerformanceQuery ?? trpc.reports.performance.useQuery as unknown as (params: PerformanceParams) => PerformanceQueryResult
  const usePerformanceCountQuery = queryHooks?.usePerformanceCountQuery ?? trpc.reports.performanceCount.useQuery as unknown as (params: PerformanceCountParams) => PerformanceCountQueryResult

  // Local search state for debounce
  const [localSearch, setLocalSearch] = useState(params.search || "")
  const [debouncedSearch, setDebouncedSearch] = useState(params.search || "")
  const [isExporting, setIsExporting] = useState(false)

  /** Build column visibility state for a given tab: hides the dimension that matches
   *  the current groupBy (since it's already the Name column), and hides product/adAccount
   *  columns on non-matching tabs. */
  const buildTabVisibility = useCallback((tab: string): VisibilityState => {
    const state: VisibilityState = {}

    // Hide the dimension column that matches the current groupBy tab
    const matchedDimCol = TAB_TO_DIMENSION_COLUMN[tab]
    if (matchedDimCol) {
      state[matchedDimCol] = false
    }

    // Hide product-specific display columns on non-product tabs
    if (tab !== "product") {
      for (const col of PRODUCT_COLUMNS) {
        state[col.id] = false
      }
    }

    // Hide ad-account-specific columns on non-adAccount tabs
    if (tab !== "adAccount") {
      for (const col of AD_ACCOUNT_COLUMNS) {
        state[col.id] = false
      }
    }

    // All dimension columns hidden by default (user toggles them on)
    for (const dim of DIMENSION_COLUMNS) {
      if (state[dim.id] === undefined) {
        state[dim.id] = false
      }
    }

    return state
  }, [])

  // Column visibility state — initialized with tab presets + breakdownBy URL params
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const base = buildTabVisibility(params.tab)
    // Also set visibility based on breakdownBy URL param (for shared links)
    const breakdownFields = params.breakdownBy ? params.breakdownBy.split(",").filter(Boolean) : []
    for (const field of breakdownFields) {
      const colId = BREAKDOWN_TO_COLUMN[field]
      if (colId && base[colId] !== undefined) {
        base[colId] = true
      }
    }
    return base
  })

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
    setParams({ search: value || null, page: 1 })
  }, 300)

  // Sync local search when URL params change externally
  useEffect(() => {
    setLocalSearch(params.search || "")
    setDebouncedSearch(params.search || "")
  }, [params.search])

  // Parse breakdownBy from URL params
  const breakdownBy = useMemo(() => {
    const raw = params.breakdownBy
    if (!raw) return []
    return raw.split(",").filter(Boolean)
  }, [params.breakdownBy])

  /** Auto-derive breakdownBy from column visibility.
   *  When a dimension column that needs breakdownBy becomes visible, add its
   *  breakdown value. When it's hidden, remove it.
   *  NOTE: `params.breakdownBy` is intentionally excluded from deps to avoid
   *  infinite loop — this effect writes to breakdownBy when columns change. */
  useEffect(() => {
    const newBreakdownBy: string[] = []
    for (const dim of DIMENSION_COLUMNS) {
      if (dim.needsBreakdown && columnVisibility[dim.id] !== false) {
        const breakdownValue = COLUMN_TO_BREAKDOWN[dim.id]
        if (breakdownValue) {
          newBreakdownBy.push(breakdownValue)
        }
      }
    }

    const newBreakdownStr = newBreakdownBy.length > 0 ? newBreakdownBy.join(",") : ""

    // Only update if different to avoid unnecessary re-renders
    if (newBreakdownStr !== (params.breakdownBy || "")) {
      setParams({ breakdownBy: newBreakdownStr || null, page: 1 })
    }
    // `params.breakdownBy` is intentionally excluded from deps to avoid an
    // infinite loop — this effect writes to breakdownBy when columns change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibility, setParams])

  // Derive topFields from visible columns only — reduces server load by
  // only requesting attribute data for columns the user can actually see.
  const topFields = useMemo(() => {
    const fields: string[] = []
    for (const [colId, field] of Object.entries(COLUMN_TO_TOP_FIELD)) {
      if (columnVisibility[colId] !== false) {
        fields.push(field)
      }
    }
    return fields
  }, [columnVisibility])

  // Read filters from URL params
  const filters = useMemo(() => params.filters ?? [], [params.filters])
  const joinOperator = useMemo(() => params.joinOperator ?? "and", [params.joinOperator])

  // Build typed performance params — no more Record<string, unknown> cast
  const performanceParams: PerformanceParams = useMemo(
    () => ({
      groupBy: params.tab,
      period: params.period,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      page: params.page,
      perPage: params.perPage,
      search: debouncedSearch || undefined,
      sortBy: params.sortBy || undefined,
      sortDir: params.sortDir || undefined,
      topFields,
      breakdownBy: breakdownBy.length > 0 ? breakdownBy : undefined,
      filters: filters.length > 0 ? filters : undefined,
      joinOperator: joinOperator,
    }),
    [params.tab, params.period, params.dateFrom, params.dateTo, params.page, params.perPage, debouncedSearch, params.sortBy, params.sortDir, topFields, breakdownBy, filters, joinOperator]
  )

  // Fetch performance data — data is now typed as KpiRow[] | undefined
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePerformanceQuery(performanceParams)

  // Fetch total count for pagination — typed params, no Record<string, unknown>
  const countParams: PerformanceCountParams = {
    groupBy: params.tab,
    period: params.period,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    search: debouncedSearch || undefined,
    breakdownBy: breakdownBy.length > 0 ? breakdownBy : undefined,
    filters: filters.length > 0 ? filters : undefined,
    joinOperator: joinOperator,
  }
  const { data: countData } = usePerformanceCountQuery(countParams)

  const totalCount = countData?.total ?? 0
  // No cast needed — data is already KpiRow[] | undefined from PerformanceQueryResult
  const tableData = useMemo(() => data ?? [], [data])
  const totalPages = Math.max(1, Math.ceil(totalCount / params.perPage))

  // Sorting state derived from URL params
  const sorting: SortingState = useMemo(() => {
    if (params.sortBy) {
      return [{ id: params.sortBy, desc: params.sortDir === "desc" }]
    }
    return []
  }, [params.sortBy, params.sortDir])

  const handleSortingChange = useCallback(
    (newSorting: SortingState) => {
      if (newSorting.length === 0) {
        setParams({ sortBy: null, sortDir: null })
      } else {
        const first = newSorting[0]
        if (first) {
          setParams({
            sortBy: first.id,
            sortDir: first.desc ? "desc" : "asc",
          })
        }
      }
    },
    [setParams]
  )

  // Pagination state derived from URL params
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: params.page - 1, // TanStack uses 0-based index
      pageSize: params.perPage,
    }),
    [params.page, params.perPage]
  )

  const handlePaginationChange = useCallback(
    (newPagination: PaginationState) => {
      setParams({
        page: newPagination.pageIndex + 1, // Convert back to 1-based
        perPage: newPagination.pageSize,
      })
    },
    [setParams]
  )

  // Tab switch handler: reset page to 1, clear search, apply tab preset
  const handleTabChange = (value: GroupByValue) => {
    setLocalSearch("")
    setDebouncedSearch("")
    setColumnVisibility(buildTabVisibility(value))
    setParams({
      tab: value,
      page: 1,
      search: null,
      breakdownBy: null,
    })
  }

  // Search input handler
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    debouncedSetSearch(value)
  }

  // Date range change handler
  const handleDateChange = (dateFrom: string | null, dateTo: string | null) => {
    setParams({
      dateFrom,
      dateTo,
      page: 1,
    })
  }

  /** Build the full column list for the Columns dropdown.
   *  Filter out the dimension that matches the current groupBy tab
   *  (it's already rendered as the Name column). */
  const columns = useMemo(() => {
    let cols = [...ALL_COLUMNS]

    // Tab-specific columns are always in the pool
    cols = [...cols, ...AD_ACCOUNT_COLUMNS, ...PRODUCT_COLUMNS]

    // Add dimension columns, filtering out the one that matches the current groupBy
    const matchedDimCol = TAB_TO_DIMENSION_COLUMN[params.tab]
    for (const dim of DIMENSION_COLUMNS) {
      // Skip the dimension that matches the current groupBy tab
      if (matchedDimCol && dim.id === matchedDimCol) continue
      cols.push({ id: dim.id, label: dim.label })
    }

    return cols
  }, [params.tab])

  // CSV Export handler
  const handleExport = useCallback(() => {
    try {
      setIsExporting(true)

      // Get visible column IDs
      const visibleIds = columns
        .filter((col) => columnVisibility[col.id] !== false)
        .map((col) => col.id)

      const csv = generateCsv(columns, tableData, visibleIds)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `kpi-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }, [tableData, columns, columnVisibility])

  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title="Reports KPI"
        description="Performance KPIs grouped by dimension. Analyze campaigns, products, advertisers, media buyers, and ad accounts."
      />

      {/* Tab Bar */}
      <KpiTabBar
        activeTab={params.tab as GroupByValue}
        onTabChange={handleTabChange}
        disabled={isLoading && !data}
      />

      {/* Data Grid Area */}        <KpiDataGrid
          data={tableData}
          isLoading={isFetching}
          activeTab={params.tab as GroupByValue}
          totalCount={totalCount}
          pageCount={totalPages}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          breakdownBy={breakdownBy}
          search={localSearch}
          onSearchChange={handleSearchChange}
          dateFrom={params.dateFrom}
          dateTo={params.dateTo}
          onDateChange={handleDateChange}
          error={error}
          onRetry={() => refetch()}
          onExport={handleExport}
          isExporting={isExporting}
          allColumns={columns}
        />
    </div>
  )
}
