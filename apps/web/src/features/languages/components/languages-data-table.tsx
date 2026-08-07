"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import * as React from "react"
import type { Language } from "../queries"
import { useLanguages } from "../queries"
import type { GetLanguagesSchema } from "../validations"
import { DeleteLanguageDialog } from "./delete-language-dialog"
import { getLanguagesTableColumns } from "./languages-table-columns"
import { UpdateLanguageDialog } from "./update-language-dialog"
import { LanguagesTableActionBar } from "./languages-table-action-bar"

interface LanguagesDataTableProps {
  search: GetLanguagesSchema
}

export function LanguagesDataTable({ search }: LanguagesDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<Language>().withDefault([
      { id: "name", desc: false },
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
    sort: states.sort,
    filters: states.filters,
    joinOperator: states.joinOperator,
  }

  const { data, isLoading } = useLanguages(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: Language }
    variant: "update" | "delete"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getLanguagesTableColumns({ setRowAction }),
    []
  )

  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "name", desc: false }],
      columnPinning: { right: ["actions"], left: ["select"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    enableColumnResizing: true,
  })

  return (
    <DataTableProvider table={table} resizing={resizing}>
      {isLoading ? (
        <DataTableSkeleton
          columnCount={4}
          rowCount={10}
          filterCount={1}
          withViewOptions={false}
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
          />
        </DataTable>
      )}

      <LanguagesTableActionBar table={table} />

      <UpdateLanguageDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        language={rowAction?.row.original ?? null}
      />

      <DeleteLanguageDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        language={rowAction?.row.original ?? null}
      />
    </DataTableProvider>
  )
}
