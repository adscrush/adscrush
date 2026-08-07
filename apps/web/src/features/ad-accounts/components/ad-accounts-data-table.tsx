"use client"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbarShell } from "@/components/data-table/data-table-toolbar-shell"
import { useDataTable } from "@/hooks/use-data-table"
import { DataTableProvider } from "@/providers/data-table-provider"
import { useFeatureFlags } from "@/providers/feature-flags-provider"
import type { DataTableRowAction, QueryKeys } from "@adscrush/shared/types/data-table"
import * as React from "react"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsStringEnum, useQueryStates } from "nuqs"
import type { AdAccount as AdAccountDb } from "@adscrush/db/schema"
import type { AdAccount } from "../queries"
import { useAdAccounts } from "../queries"
import type { GetAdAccountsSchema } from "../validations"
import { AdAccountsTableActionBar } from "./ad-account-table-action-bar"
import { getAdAccountsTableColumns } from "./ad-accounts-table-columns"
import { DeleteAdAccountsDialog } from "./delete-ad-accounts-dialog"
import { UpdateAdAccountDialog } from "./update-ad-account-dialog"

interface AdAccountsDataTableProps {
  search: GetAdAccountsSchema
  queryKeys?: Partial<QueryKeys>
}

export function AdAccountsDataTable({ search, queryKeys }: AdAccountsDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<AdAccountDb>().withDefault([{ id: "createdAt", desc: true }]),
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault(search.joinOperator),
  })

  const params = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    sort: states.sort ?? [{ id: "createdAt", desc: true }],
    filters: states.filters ?? [],
    joinOperator: (states.joinOperator ?? "and") as "and" | "or",
  }

  const { data, isLoading } = useAdAccounts(params)

  const [rowAction, setRowAction] = React.useState<DataTableRowAction<AdAccount> | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(() => getAdAccountsTableColumns({ setRowAction }), [])

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
    shallow: true,
    clearOnDefault: true,
    enableColumnResizing: true,
  })

  return (
    <DataTableProvider table={table} resizing={resizing}>
      {isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} filterCount={2} withViewOptions={true} withPagination={true} />
      ) : (
        <DataTable table={table} actionBar={<AdAccountsTableActionBar table={table} />}>
          <DataTableToolbarShell
            table={table}
            resizing={resizing}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
          />
        </DataTable>
      )}

      <UpdateAdAccountDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        adAccount={rowAction?.row.original ?? null}
      />

      <DeleteAdAccountsDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        adAccount={rowAction?.row.original ?? null}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </DataTableProvider>
  )
}
