"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useQueryClient } from "@tanstack/react-query"
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
import type { User as UserFromDB } from "@adscrush/db/schema"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import type { User } from "../queries"
import { useUsers } from "../queries"
import type { GetUsersSchema } from "../validations"
import { userKeys } from "../query-options"
import { BanDialog } from "@/components/common/ban-dialog"
import { ImpersonateDialog } from "@/components/common/impersonate-dialog"
import { ChangeRoleDialog } from "./change-role-dialog"
import { getUsersTableColumns } from "./users-table-columns"

interface UsersDataTableProps {
  search: GetUsersSchema
  queryKeys?: Partial<QueryKeys>
}

export function UsersDataTable({ search, queryKeys }: UsersDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()
  const queryClient = useQueryClient()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<UserFromDB>().withDefault([
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
  } as GetUsersSchema

  const { data, isLoading } = useUsers(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: User }
    variant: "ban" | "unban" | "impersonate" | "change-role"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(() => getUsersTableColumns({ setRowAction }), [])

  const { table, shallow, debounceMs, throttleMs, resizing } = useDataTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.pageCount ?? 0,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: true,
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
          />
        </DataTable>
      )}

      <BanDialog
        open={rowAction?.variant === "ban" || rowAction?.variant === "unban"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.row.original?.id}
        name={rowAction?.row.original?.name}
        variant={rowAction?.variant === "ban" ? "ban" : "unban"}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: userKeys.all })}
      />

      <ImpersonateDialog
        open={rowAction?.variant === "impersonate"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.row.original?.id}
        name={rowAction?.row.original?.name}
        label="User"
      />

      <ChangeRoleDialog
        open={rowAction?.variant === "change-role"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.row.original?.id}
        name={rowAction?.row.original?.name}
        currentRole={rowAction?.row.original?.role}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: userKeys.all })}
      />
    </DataTableProvider>
  )
}
