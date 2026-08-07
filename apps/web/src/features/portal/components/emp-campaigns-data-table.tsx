"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"

import type { QueryKeys } from "@adscrush/shared/types/data-table"
import type { GetPortalCampaignsSchema } from "../validations/campaigns"
import { portalCampaignKeys } from "../queries/campaigns"
import { getCampaignsTableColumns } from "@/features/campaigns/components/campaigns-table-columns"
import { PortalDataTable } from "./portal-data-table"
import type { Campaign } from "@/features/campaigns/queries"

interface EmpCampaignsDataTableProps {
  search: GetPortalCampaignsSchema
  queryKeys?: Partial<QueryKeys>
}

export function EmpCampaignsDataTable({ search, queryKeys }: EmpCampaignsDataTableProps) {
  const utils = trpc.useUtils()
  const columns = React.useMemo(
    () =>
      getCampaignsTableColumns({
        setRowAction: () => {},
        productOptions: [],
        funnelOptions: [],
        campaignDetailPrefix: "/p/campaigns",
      }),
    []
  )

  return (
    <PortalDataTable<Campaign>
      columns={columns}
      search={search}
      queryKeys={queryKeys}
      queryKeyList={portalCampaignKeys.list}
      queryFn={(params) =>
        utils.portal.myCampaignsList.fetch(params).then((result) => ({
          data: result.items,
          pageCount: result.pageCount,
          total: result.total,
        }))
      }
    />
  )
}
