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
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs"
import * as React from "react"
import type { Category } from "../queries"
import { useCategories } from "../queries"
import type { GetCategoriesSchema } from "../validations"
import { DeleteCategoryDialog } from "./delete-category-dialog"
import { getCategoriesTableColumns } from "./categories-table-columns"
import { UpdateCategoryDialog } from "./update-category-dialog"
import { CategoriesTableActionBar } from "./categories-table-action-bar"

interface CategoriesDataTableProps {
  search: GetCategoriesSchema
}

export function CategoriesDataTable({ search }: CategoriesDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<Category>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault(
      search.joinOperator
    ),
    search: parseAsString.withDefault(search.search),
  })

  const params = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    sort: states.sort,
    filters: states.filters,
    joinOperator: states.joinOperator,
    search: states.search,
  }

  const { data, isLoading } = useCategories(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: Category }
    variant: "update" | "delete"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getCategoriesTableColumns({ setRowAction }),
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

      <CategoriesTableActionBar table={table} />

      <UpdateCategoryDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        category={rowAction?.row.original ?? null}
      />

      <DeleteCategoryDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        category={rowAction?.row.original ?? null}
      />
    </DataTableProvider>
  )
}
