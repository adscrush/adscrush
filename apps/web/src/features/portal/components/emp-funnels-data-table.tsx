"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { GetPortalFunnelsSchema } from "../validations/funnels"
import { portalFunnelKeys } from "../queries/funnels"
import { getFunnelsTableColumns } from "@/features/funnels/components/funnels-table-columns"
import { PortalDataTable } from "./portal-data-table"
import type { Funnel } from "@/features/funnels/queries"

interface EmpFunnelsDataTableProps {
  search: GetPortalFunnelsSchema
  queryKeys?: Partial<QueryKeys>
}

export function EmpFunnelsDataTable({ search, queryKeys }: EmpFunnelsDataTableProps) {
  const utils = trpc.useUtils()
  const columns = React.useMemo(() => getFunnelsTableColumns({ setRowAction: () => {} }), [])

  return (
    <PortalDataTable<Funnel>
      columns={columns}
      search={search}
      queryKeys={queryKeys}
      columnCount={7}
      queryKeyList={portalFunnelKeys.list}
      queryFn={(params) =>
        utils.portal.myFunnelsList.fetch(params).then((result) => ({
          data: result.items,
          pageCount: result.pageCount,
          total: result.total,
        }))
      }
    />
  )
}
