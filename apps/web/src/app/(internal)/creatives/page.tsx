import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { CreativesFileExplorer } from "@/features/creatives/components/creatives-file-explorer"
import { getCreativesQueryOptions } from "@/features/creatives/server-queries"
import { searchParamsCache } from "@/features/creatives/validations"
import type { SearchParams } from "@/types"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface CreativesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function CreativesPage(props: CreativesPageProps) {
  const allowed = await checkPagePermission("creatives.view")
  if (!allowed) return <PermissionDenied resource="creatives" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getCreativesQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader
        title="Creatives"
        description="Manage your creatives"
      />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <CreativesFileExplorer search={search} />
            </HydrationBoundary>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
