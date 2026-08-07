"use client"

import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { EmpAdvertisersDataTable } from "./emp-advertisers-data-table"
import type { GetPortalAdvertisersSchema } from "../validations/advertisers"

interface EmpAdvertisersClientProps {
  search: GetPortalAdvertisersSchema
}

export function EmpAdvertisersClient({ search }: EmpAdvertisersClientProps) {
  return (
    <ContentShell>
      <PageHeader
        title="My Advertisers"
        description="Advertisers whose products you work with"
      />

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <EmpAdvertisersDataTable
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
