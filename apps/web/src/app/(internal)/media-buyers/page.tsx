import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddMediaBuyerDialog } from "@/features/media-buyers/components/add-media-buyer-dialog"
import { MediaBuyersDataTable } from "@/features/media-buyers/components/media-buyers-data-table"
import { getMediaBuyersQueryOptions } from "@/features/media-buyers/server-queries"
import { searchParamsCache } from "@/features/media-buyers/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface MediaBuyersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function MediaBuyersPage(props: MediaBuyersPageProps) {
  const allowed = await checkPagePermission("media_buyers.view")
  if (!allowed) return <PermissionDenied resource="media buyers" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getMediaBuyersQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Media Buyers" description="Manage your media buyers">
        <AddMediaBuyerDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Media Buyer
          </Button>
        </AddMediaBuyerDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <MediaBuyersDataTable
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
