"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"

import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { GetPortalAdAccountsSchema } from "../validations/ad-accounts"
import { portalAdAccountKeys } from "../queries/ad-accounts"
import { getAdAccountsTableColumns } from "@/features/ad-accounts/components/ad-accounts-table-columns"
import { PortalDataTable } from "./portal-data-table"
import type { AdAccount } from "@/features/ad-accounts/queries"

interface EmpAdAccountsDataTableProps {
  search: GetPortalAdAccountsSchema
  queryKeys?: Partial<QueryKeys>
}

export function EmpAdAccountsDataTable({ search, queryKeys }: EmpAdAccountsDataTableProps) {
  const utils = trpc.useUtils()
  const columns = React.useMemo(() => getAdAccountsTableColumns({ setRowAction: () => {} }), [])

  return (
    <PortalDataTable<AdAccount>
      columns={columns}
      search={search}
      queryKeys={queryKeys}
      queryKeyList={portalAdAccountKeys.list}
      queryFn={(params) =>
        utils.portal.myAdAccountsList.fetch(params).then((result) => ({
          data: result.items,
          pageCount: result.pageCount,
          total: result.total,
        }))
      }
    />
  )
}
