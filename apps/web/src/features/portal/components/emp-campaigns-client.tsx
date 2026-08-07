"use client"

import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { EmpCampaignsDataTable } from "./emp-campaigns-data-table"
import type { GetPortalCampaignsSchema } from "../validations/campaigns"
import type { ReactNode } from "react"

interface EmpCampaignsClientProps {
  search: GetPortalCampaignsSchema
  /** Optional page action rendered in the header (e.g. Create Campaign). */
  createAction?: ReactNode
}

export function EmpCampaignsClient({ search, createAction }: EmpCampaignsClientProps) {
  return (
    <ContentShell>
      <PageHeader title="My Campaigns" description="Campaigns linked to your ad accounts">
        {createAction}
      </PageHeader>

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <FeatureFlagsProvider defaultFilterFlag="commandFilters" showToggleGroup={false}>
            <EmpCampaignsDataTable
              search={search}
              queryKeys={{
                page: "page",
                perPage: "perPage",
                sort: "sort",
                filters: "filters",
                joinOperator: "joinOperator",
              }}
            />
          </FeatureFlagsProvider>
        </div>
      </div>
    </ContentShell>
  )
}
