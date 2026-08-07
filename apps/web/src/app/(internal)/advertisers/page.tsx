import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddAdvertiserDialog } from "@/features/advertisers/components/add-advertiser-dialog"
import { AdvertisersDataTable } from "@/features/advertisers/components/advertisers-data-table"
import { getAdvertisersQueryOptions } from "@/features/advertisers/server-queries"
import { searchParamsCache } from "@/features/advertisers/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface AdvertisersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AdvertisersPage(props: AdvertisersPageProps) {
  const allowed = await checkPagePermission("advertiser.view")
  if (!allowed) return <PermissionDenied resource="advertisers" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)
  
  // Use the shared getQueryClient utility for consistent SSR configuration
  const queryClient = getQueryClient()

  // Prefetch data on the server
  await queryClient.prefetchQuery(getAdvertisersQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Advertisers" description="Manage your advertisers">
        <AddAdvertiserDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Advertiser
          </Button>
        </AddAdvertiserDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <AdvertisersDataTable
                  search={search}
                  queryKeys={{
                    page: "page",
                    perPage: "perPage",
                    sort: "sort",
                    filters: "filters",
                    joinOperator: "joinOperator",
                  }}
                />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
