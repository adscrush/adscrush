"use client"

import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { EmpFunnelsDataTable } from "./emp-funnels-data-table"
import type { GetPortalFunnelsSchema } from "../validations/funnels"

interface EmpFunnelsClientProps {
  search: GetPortalFunnelsSchema
}

export function EmpFunnelsClient({ search }: EmpFunnelsClientProps) {
  return (
    <ContentShell>
      <PageHeader
        title="My Funnels"
        description="Funnels from your products"
      />

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <EmpFunnelsDataTable
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
