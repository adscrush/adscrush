"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type {
  DataTableRowAction,
  QueryKeys,
} from "@adscrush/shared/types/data-table"
import * as React from "react"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import type { Product } from "../queries"
import { useProducts } from "../queries"
import type { GetProductsSchema } from "../validations"
import { ProductsTableActionBar } from "./products-table-action-bar"
import { getProductsTableColumns } from "./products-table-columns"
import { DeleteProductsDialog } from "./delete-products-dialog"

interface ProductsDataTableProps {
  search: GetProductsSchema
  queryKeys?: Partial<QueryKeys>
}

export function ProductsDataTable({
  search,
  queryKeys,
}: ProductsDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<Product>().withDefault([
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

  const { data, isLoading } = useProducts(params)

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Product> | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getProductsTableColumns({ setRowAction }),
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
          columnCount={7}
          rowCount={10}
          filterCount={2}
          withViewOptions={true}
          withPagination={true}
        />
      ) : (
        <DataTable
          table={table}
          actionBar={<ProductsTableActionBar table={table} />}
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

      <DeleteProductsDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        products={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </DataTableProvider>
  )
}
