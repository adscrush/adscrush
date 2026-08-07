"use client"

import * as React from "react"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableSearch } from "@/components/data-table/data-table-search"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import { toast } from "@adscrush/ui/sonner"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import type {
  DataTableRowAction,
  QueryKeys,
} from "@adscrush/shared/types/data-table"

import { useCampaigns, useUpdateCampaign } from "../queries"
import type { Campaign } from "../queries"
import type {
  CampaignListSortableColumns,
  GetCampaignsSchema,
} from "../validations"
import { getCampaignsTableColumns } from "./campaigns-table-columns"
import { DeleteCampaignDialog } from "./delete-campaign-dialog"

interface CampaignsDataTableProps {
  search: GetCampaignsSchema
  queryKeys?: Partial<QueryKeys>
}

/**
 * Campaigns data table component with advanced filtering and sorting.
 * Implements server-side pagination and filtering with lazy-loaded filter options.
 *
 * @remarks
 * - Filter options (products, funnels) are NOT fetched on initial render
 * - Options are lazy-loaded only when user interacts with filters
 * - This prevents blocking the main table render and improves initial page load
 * - Shows skeleton only on initial load, keeps UI visible during refetches
 */
export function CampaignsDataTable({
  search,
  queryKeys,
}: CampaignsDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<CampaignListSortableColumns>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault(
      search.joinOperator
    ),
  })

  const params: GetCampaignsSchema = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    sort: states.sort ?? [{ id: "createdAt", desc: true }],
    filters: states.filters ?? [],
    joinOperator: (states.joinOperator ?? "and") as "and" | "or",
  }

  // Fetch campaigns data
  const { data: campaignsData, isLoading, isFetching } = useCampaigns(params)
  const updateCampaign = useUpdateCampaign()

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Campaign> | null>(null)

  const handleStatusChange = React.useCallback(
    (campaignId: string, status: "active" | "inactive") => {
      updateCampaign.mutate(
        { id: campaignId, data: { status } },
        {
          onSuccess: () => {
            toast.success(`Campaign status updated to ${status}.`)
          },
          onError: (error) => {
            toast.error(
              error.message || "Failed to update campaign status."
            )
          },
        }
      )
    },
    [updateCampaign]
  )

  /**
   * Track if this is the first render to show skeleton only once.
   * After initial load, we keep the UI visible during refetches.
   */
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false)

  React.useEffect(() => {
    if (!isLoading && campaignsData) {
      setHasLoadedOnce(true)
    }
  }, [isLoading, campaignsData])

  /**
   * Show full skeleton only on first load when we have no data.
   * Once data is loaded, keep the UI visible during subsequent fetches.
   */
  const showFullSkeleton = isLoading && !hasLoadedOnce

  /**
   * Column definitions with empty filter options initially.
   * Filter options will be lazy-loaded when user clicks on a filter.
   * This prevents blocking the table render while waiting for filter data.
   */
  const columns = React.useMemo(
    () =>
      getCampaignsTableColumns({
        setRowAction,
        onStatusChange: handleStatusChange,
        productOptions: [], // Empty - will be lazy-loaded
        funnelOptions: [], // Empty - will be lazy-loaded
      }),
    [handleStatusChange, setRowAction]
  )

  /**
   * Initialize table instance with memoized configuration.
   * Uses TanStack Table for efficient data handling.
   */
  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: campaignsData?.data ?? [],
    columns,
    pageCount: campaignsData?.pageCount ?? 0,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    enableColumnResizing: true,
  })

  // Show full skeleton only on initial load
  if (showFullSkeleton) {
    return (
      <DataTableSkeleton
        columnCount={6}
        rowCount={10}
        filterCount={2}
        withViewOptions={true}
        withPagination={true}
      />
    )
  }

  // After initial load, always show the table with toolbar
  return (
    <DataTableProvider table={table} resizing={resizing}>
      <DataTable table={table}>
        <DataTableToolbarShell
          table={table}
          resizing={resizing}
          shallow={shallow}
          debounceMs={debounceMs}
          throttleMs={throttleMs}
          isFetching={isFetching}
          searchName="search"
          extra={
            <DataTableSearch
              isFetching={isFetching}
              name="search"
              placeholder="Search campaigns..."
            />
          }
        />
      </DataTable>

      <DeleteCampaignDialog
        campaignId={rowAction?.row.original.id ?? ""}
        campaignName={rowAction?.row.original.name ?? ""}
        campaignStatus={rowAction?.row.original.status ?? ""}
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null)
        }}
        showTrigger={false}
      />
    </DataTableProvider>
  )
}
