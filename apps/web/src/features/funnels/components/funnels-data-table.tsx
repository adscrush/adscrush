"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { DataTableRowAction } from "@adscrush/shared/types/data-table"
import * as React from "react"

import { DataTableSearch } from "@/components/data-table/data-table-search"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import { useFunnelCounts, useFunnels } from "../queries"
import type {
  FunnelListSortableColumns,
  GetFunnelsSchema,
} from "../validations"
import { getFunnelsTableColumns } from "./funnels-table-columns"
import { DeleteFunnelDialog } from "./delete-funnel-dialog"
import type { Funnel } from "../queries"

interface FunnelsDataTableProps {
  search: GetFunnelsSchema
  queryKeys?: Partial<QueryKeys>
}

export function FunnelsDataTable({ search, queryKeys }: FunnelsDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Funnel> | null>(null)

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<FunnelListSortableColumns>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault(
      search.joinOperator
    ),
  })

  // These stay in sync with the live URL params (set by useDataTable)
  const params: GetFunnelsSchema = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    sort: states.sort ?? [{ id: "createdAt", desc: true }],
    filters: states.filters ?? [],
    joinOperator: (states.joinOperator ?? "and") as "and" | "or",
  }

  const { data, isLoading, isFetching } = useFunnels(params)
  const { data: counts } = useFunnelCounts()

  const columns = React.useMemo(
    () => getFunnelsTableColumns({ setRowAction, counts }),
    [counts, setRowAction]
  )

  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"], left: ["select"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    enableColumnResizing: true,
  })

  const deleteTarget = rowAction?.variant === "delete" ? rowAction.row.original : null

  return (
    <DataTableProvider table={table} resizing={resizing}>
      {isLoading ? (
        <DataTableSkeleton
          columnCount={8}
          rowCount={10}
          filterCount={2}
          withViewOptions={true}
          withPagination={true}
        />
      ) : (
        <DataTable table={table}>
          <DataTableToolbarShell
            table={table}
            resizing={resizing}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            isFetching={isFetching}
            searchName="search"
            extra={<DataTableSearch isFetching={isFetching} name="search" />}
          />
        </DataTable>
      )}

      <DeleteFunnelDialog
        funnelId={deleteTarget?.id ?? null}
        funnelName={deleteTarget?.name ?? ""}
        open={!!rowAction && rowAction.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) setRowAction(null)
        }}
      />
    </DataTableProvider>
  )
}
