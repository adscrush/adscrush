"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type { QueryKeys } from "@adscrush/shared/types/data-table"
import * as React from "react"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import type { Creative as RouterCreative } from "@adscrush/db/schema"
import type { Creative } from "../queries"
import { useCreatives } from "../queries"
import type { GetCreativesSchema } from "../validations"
import { CreativesTableActionBar } from "./creatives-table-action-bar"
import { getCreativesTableColumns } from "./creatives-table-columns"
import { DeleteCreativesDialog } from "./delete-creatives-dialog"
import { PreviewCreativeDialog } from "./preview-creative-dialog"

interface CreativesDataTableProps {
  search: GetCreativesSchema
  queryKeys?: Partial<QueryKeys>
}

export function CreativesDataTable({
  search,
  queryKeys,
}: CreativesDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<RouterCreative>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault(
      search.joinOperator
    ),
  })

  const params = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    sort: states.sort ?? [{ id: "createdAt", desc: true }],
    filters: states.filters ?? [],
    joinOperator: (states.joinOperator ?? "and") as "and" | "or",
  }

  const { data, isLoading } = useCreatives(params)

  const [previewCreative, setPreviewCreative] =
    React.useState<Creative | null>(null)

  const [deleteCreative, setDeleteCreative] =
    React.useState<Creative | null>(null)

  const columns = React.useMemo(
    () => getCreativesTableColumns({ setPreviewCreative, setDeleteCreative }),
    []
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

  return (
    <DataTableProvider table={table} resizing={resizing}>
      {isLoading ? (
        <DataTableSkeleton
          columnCount={6}
          rowCount={10}
          filterCount={2}
          withViewOptions={true}
          withPagination={true}
        />
      ) : (
        <DataTable
          table={table}
          actionBar={<CreativesTableActionBar table={table} />}
        >
          <DataTableToolbarShell
            table={table}
            resizing={resizing}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
          />
        </DataTable>
      )}

      <PreviewCreativeDialog
        open={previewCreative !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewCreative(null)
        }}
        creative={previewCreative}
      />

      <DeleteCreativesDialog
        open={deleteCreative !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCreative(null)
        }}
        creatives={deleteCreative ? [deleteCreative] : []}
        showTrigger={false}
      />
    </DataTableProvider>
  )
}
