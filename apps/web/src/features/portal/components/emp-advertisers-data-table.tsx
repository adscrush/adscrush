"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"

import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { GetPortalAdvertisersSchema } from "../validations/advertisers"
import { portalAdvertiserKeys } from "../queries/advertisers"
import { getAdvertisersTableColumns } from "@/features/advertisers/components/advertisers-table-columns"
import { PortalDataTable } from "./portal-data-table"
import type { Advertiser } from "@/features/advertisers/queries"

interface EmpAdvertisersDataTableProps {
  search: GetPortalAdvertisersSchema
  queryKeys?: Partial<QueryKeys>
}

export function EmpAdvertisersDataTable({ search, queryKeys }: EmpAdvertisersDataTableProps) {
  const utils = trpc.useUtils()
  const columns = React.useMemo(() => getAdvertisersTableColumns({ setRowAction: () => {} }), [])

  return (
    <PortalDataTable<Advertiser>
      columns={columns}
      search={search}
      queryKeys={queryKeys}
      queryKeyList={portalAdvertiserKeys.list}
      queryFn={(params) =>
        utils.portal.myAdvertisersList.fetch(params).then((result) => ({
          data: result.items,
          pageCount: result.pageCount,
          total: result.total,
        }))
      }
    />
  )
}
