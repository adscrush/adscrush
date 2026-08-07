"use client"

import * as React from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getSortingStateParser } from "@adscrush/shared/lib/parsers"
import { useDataTableUrlState } from "@/components/data-table/hooks/use-data-table-url-state"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableAdvancedFilterToolbar } from "@/components/data-table/data-table-advanced-filter-toolbar"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { ColumnDef } from "@tanstack/react-table"

interface PortalDataTableProps<TData extends { id: string }> {
  /** Columns to render (without "actions" — filtered out automatically) */
  columns: ColumnDef<TData>[]
  /** URL search params from the parent page */
  search: Record<string, unknown>
  /** URL state query key configuration */
  queryKeys?: Partial<QueryKeys>
  /** Number of skeleton columns shown while loading */
  columnCount?: number
  /** React Query key factory list function */
  queryKeyList: (params: Record<string, unknown>) => readonly unknown[]
  /** Async function that fetches data from the portal tRPC router */
  queryFn: (params: Record<string, unknown>) => Promise<{ data: TData[]; pageCount: number; total?: number }>
  /** Default sort ID (ascending/descending defaults to desc) */
  defaultSortId?: string
}

/** Search params include the page/perPage/joinOperator defaults the url-state
 *  hook relies on; the remaining keys are generic query-string unknowns. */
type PortalSearchParams = Record<string, unknown> & {
  page: number
  perPage: number
  joinOperator: "and" | "or"
}

export function PortalDataTable<TData extends { id: string }>({
  columns: rawColumns,
  search,
  queryKeys,
  columnCount = 6,
  queryKeyList,
  queryFn,
  defaultSortId = "createdAt",
}: PortalDataTableProps<TData>) {
  // Remove actions column — portal is read-only
  const columns = React.useMemo(
    () => rawColumns.filter((col) => col.id !== "actions") as ColumnDef<TData>[],
    [rawColumns],
  )

  const params = useDataTableUrlState<PortalSearchParams, TData>({
    search: search as PortalSearchParams,
    sortParser: getSortingStateParser<TData>().withDefault([
      { id: defaultSortId as Extract<keyof TData, string>, desc: true },
    ]),
  })

  const [debouncedParams] = useDebouncedValue(params, { wait: 300 })

  const { data, isLoading } = useQuery({
    queryKey: queryKeyList(debouncedParams),
    queryFn: () => queryFn(debouncedParams),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })

  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: (data?.data ?? []) as TData[],
    columns,
    pageCount: data?.pageCount ?? 0,
    initialState: {
      sorting: [{ id: defaultSortId as unknown as Extract<keyof TData, string>, desc: true }],
      columnPinning: { left: ["select"] },
    },
    queryKeys,
    getRowId: (originalRow: TData) => originalRow.id,
    shallow: true,
    clearOnDefault: true,
    enableColumnResizing: true,
  })

  return (
    <DataTableProvider table={table} resizing={resizing}>
      {isLoading ? (
        <DataTableSkeleton
          columnCount={columnCount}
          rowCount={10}
          filterCount={2}
          withViewOptions={true}
          withPagination={true}
        />
      ) : (
        <DataTable table={table}>
          <DataTableAdvancedFilterToolbar
            table={table}
            resizing={resizing}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
          />
        </DataTable>
      )}
    </DataTableProvider>
  )
}
