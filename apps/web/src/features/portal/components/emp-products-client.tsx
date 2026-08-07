"use client"

import * as React from "react"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { EmpProductsDataTable } from "./emp-products-data-table"
import type { GetPortalProductsSchema } from "../validations/products"

interface EmpProductsClientProps {
  search: GetPortalProductsSchema
}

export function EmpProductsClient({ search }: EmpProductsClientProps) {
  return (
    <ContentShell>
      <PageHeader
        title="My Products"
        description="Products available to you"
      />

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <EmpProductsDataTable
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
