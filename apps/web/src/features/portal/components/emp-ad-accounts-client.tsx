"use client"

import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { EmpAdAccountsDataTable } from "./emp-ad-accounts-data-table"
import type { GetPortalAdAccountsSchema } from "../validations/ad-accounts"

interface EmpAdAccountsClientProps {
  search: GetPortalAdAccountsSchema
}

export function EmpAdAccountsClient({ search }: EmpAdAccountsClientProps) {
  return (
    <ContentShell>
      <PageHeader
        title="My Ad Accounts"
        description="Ad accounts assigned to you"
      />

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <EmpAdAccountsDataTable
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
