import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@adscrush/ui/components/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { type SearchParams } from "@/types"
import { searchParamsCache } from "@/features/campaigns/validations"
import { getCampaignsQueryOptions } from "@/features/campaigns/server-queries"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { CampaignsDataTable } from "@/features/campaigns/components/campaigns-data-table"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { getQueryClient } from "@/lib/query-client"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface CampaignsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function CampaignsPage(props: CampaignsPageProps) {
  const allowed = await checkPagePermission("campaigns.view")
  if (!allowed) return <PermissionDenied resource="campaigns" />

  const canCreate = await checkPagePermission("campaigns.create")

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  // Prefetch campaigns data on the server
  await queryClient.prefetchQuery(getCampaignsQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Campaigns" description="Manage your advertising campaigns">
        {canCreate && (
          <Button size="sm" asChild>
            <Link href="/campaigns/new">
              <IconPlus className="mr-2 size-3.5" />
              Create Campaign
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-1 flex-col gap-4">
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={6}
              rowCount={10}
              filterCount={2}
              withViewOptions={true}
              withPagination={true}
            />
          }
        >
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <HydrationBoundary state={dehydrate(queryClient)}>
              <CampaignsDataTable search={search} />
            </HydrationBoundary>
          </FeatureFlagsProvider>
        </Suspense>
      </div>
    </ContentShell>
  )
}
