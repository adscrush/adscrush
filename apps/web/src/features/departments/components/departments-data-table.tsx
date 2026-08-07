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
import type { Department } from "../queries"
import { useDepartments } from "../queries"
import type { GetDepartmentsSchema } from "../validations"
import { DeleteDepartmentDialog } from "./delete-department-dialog"
import { getDepartmentsTableColumns } from "./departments-table-columns"
import { UpdateDepartmentDialog } from "./update-department-dialog"
import { DepartmentsTableActionBar } from "./departments-table-action-bar"

interface DepartmentsDataTableProps {
  search: GetDepartmentsSchema
}

export function DepartmentsDataTable({ search }: DepartmentsDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<Department>().withDefault([
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
    sort: states.sort,
    filters: states.filters,
    joinOperator: states.joinOperator,
  }

  const { data, isLoading } = useDepartments(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: Department }
    variant: "update" | "delete"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getDepartmentsTableColumns({ setRowAction }),
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
          columnCount={5}
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

      <DepartmentsTableActionBar table={table} />

      <UpdateDepartmentDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        department={rowAction?.row.original ?? null}
      />

      <DeleteDepartmentDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        department={rowAction?.row.original ?? null}
      />
    </DataTableProvider>
  )
}
