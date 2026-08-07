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
import type { MediaBuyer } from "../queries"
import { useMediaBuyers } from "../queries"
import type { GetMediaBuyersSchema } from "../validations"
import { MediaBuyersTableActionBar } from "./media-buyer-table-action-bar"
import { getMediaBuyersTableColumns } from "./media-buyers-table-columns"
import { ChangePasswordDialog } from "./change-password-dialog"
import { DeleteMediaBuyersDialog } from "./delete-media-buyers-dialog"
import { ImpersonateDialog } from "@/components/common/impersonate-dialog"
import { UpdateMediaBuyerDialog } from "./update-media-buyer-dialog"

interface MediaBuyersDataTableProps {
  search: GetMediaBuyersSchema
  queryKeys?: Partial<QueryKeys>
}

export function MediaBuyersDataTable({
  search,
  queryKeys,
}: MediaBuyersDataTableProps) {
  const { enableAdvancedFilter } = useFeatureFlags()

  const [states] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    sort: getSortingStateParser<
      Omit<MediaBuyer, "accountManager">
    >().withDefault([{ id: "createdAt", desc: true }]),
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

  const { data, isLoading } = useMediaBuyers(params)

  const [rowAction, setRowAction] = React.useState<{
    row: { original: MediaBuyer }
    variant: "update" | "delete" | "changePassword" | "impersonate"
  } | null>(null)

  const handleRowActionChange = (open: boolean) => {
    if (!open) {
      setRowAction(null)
    }
  }

  const columns = React.useMemo(
    () => getMediaBuyersTableColumns({ setRowAction }),
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
          actionBar={<MediaBuyersTableActionBar table={table} />}
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

      <UpdateMediaBuyerDialog
        open={rowAction?.variant === "update"}
        onOpenChange={handleRowActionChange}
        mediaBuyer={rowAction?.row.original ?? null}
      />

      <ChangePasswordDialog
        open={rowAction?.variant === "changePassword"}
        onOpenChange={handleRowActionChange}
        mediaBuyer={rowAction?.variant === "changePassword" ? rowAction.row.original : null}
      />

      <ImpersonateDialog
        open={rowAction?.variant === "impersonate"}
        onOpenChange={handleRowActionChange}
        userId={rowAction?.variant === "impersonate" ? rowAction.row.original?.userId : null}
        name={rowAction?.variant === "impersonate" ? rowAction.row.original?.name : null}
        label="Media Buyer"
      />

      <DeleteMediaBuyersDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={handleRowActionChange}
        mediaBuyers={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
      />
    </DataTableProvider>
  )
}
