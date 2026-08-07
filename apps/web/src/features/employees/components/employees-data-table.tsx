"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useQueryClient } from "@tanstack/react-query"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type { Employee as EmployeeTypeFromDB } from "@adscrush/db/schema"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import * as React from "react"
import type { Employee } from "../queries"
import { useEmployees } from "../queries"
import type { GetEmployeesSchema } from "../validations"
import { employeeKeys } from "../query-options"
import { BanDialog } from "@/components/common/ban-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { DeleteEmployeeDialog } from "./delete-employee-dialog"
import { EmployeesTableActionBar } from "./employees-table-action-bar"
import { getEmployeesTableColumns } from "./employees-table-columns"
import { ImpersonateDialog } from "@/components/common/impersonate-dialog"
import { UpdateEmployeeDialog } from "./update-employee-dialog"

interface EmployeesDataTableProps {
  search: GetEmployeesSchema
}

export function EmployeesDataTable({ search }: EmployeesDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()
  const queryClient = useQueryClient()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<EmployeeTypeFromDB>().withDefault([]),
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

  const { data, isLoading } = useEmployees(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: Employee }
    variant: "update" | "delete" | "change-password" | "ban" | "unban" | "impersonate"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getEmployeesTableColumns({ setRowAction }),
    []
  )

  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: (data?.data ?? []),
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
          columnCount={7}
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

      <EmployeesTableActionBar table={table} />

      <UpdateEmployeeDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        employee={rowAction?.row.original ?? null}
      />

      <ChangePasswordDialog
        open={rowAction?.variant === "change-password"}
        onOpenChange={handleRowActionChange}
        employee={rowAction?.row.original ?? null}
      />

      <DeleteEmployeeDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        employee={rowAction?.row.original ?? null}
      />

      <BanDialog
        open={rowAction?.variant === "ban" || rowAction?.variant === "unban"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.row.original?.userId}
        name={rowAction?.row.original?.name}
        variant={rowAction?.variant === "ban" ? "ban" : "unban"}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: employeeKeys.all })}
      />

      <ImpersonateDialog
        open={rowAction?.variant === "impersonate"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.row.original?.userId}
        name={rowAction?.row.original?.name}
        label="User"
      />
    </DataTableProvider>
  )
}
