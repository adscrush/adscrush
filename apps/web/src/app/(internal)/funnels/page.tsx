import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { FunnelsDataTable } from "@/features/funnels/components/funnels-data-table"
import {
  getFunnelCountsServerQueryOptions,
  getFunnelsServerQueryOptions,
} from "@/features/funnels/server-queries"
import { searchParamsCache } from "@/features/funnels/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { Button } from "@adscrush/ui/components/button"
import type { SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import Link from "next/link"
import { Suspense } from "react"
import { PermissionGate } from "@/components/permission-gate"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface FunnelsPageProps {
  searchParams: Promise<SearchParams>
}

export const metadata = {
  title: "Funnels",
}

export default async function FunnelsPage(props: FunnelsPageProps) {
  const allowed = await checkPagePermission("funnels.view")
  if (!allowed) return <PermissionDenied resource="funnels" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getFunnelsServerQueryOptions(search))
  await queryClient.prefetchQuery(getFunnelCountsServerQueryOptions())

  return (
    <ContentShell>
      <PageHeader title="Funnels" description="Manage your funnels">
        <PermissionGate permission="funnels.create">
          <Button size="sm" asChild>
            <Link href="/funnels/new">
              <IconPlus className="mr-2 size-3.5" />
              New Funnel
            </Link>
          </Button>
        </PermissionGate>
      </PageHeader>
      <div className="flex flex-1 flex-col gap-4">
        <Suspense>
          <FeatureFlagsProvider
            defaultFilterFlag="commandFilters"
            showToggleGroup={false}
          >
            <HydrationBoundary state={dehydrate(queryClient)}>
              <FunnelsDataTable search={search} />
            </HydrationBoundary>
          </FeatureFlagsProvider>
        </Suspense>
      </div>
    </ContentShell>
  )
}
