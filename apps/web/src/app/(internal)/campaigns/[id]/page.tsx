import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { getQueryClient } from "@/lib/query-client"
import { getCampaignQueryOptions, getCampaignStatsQueryOptions } from "@/features/campaigns/server-queries"
import { CampaignDetails } from "@/features/campaigns/components/campaign-details"
import { ContentShell } from "@/components/common/content-shell"

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params

  const allowed = await checkPagePermission("campaigns.view")
  if (!allowed) return <PermissionDenied resource="this campaign" />

  const queryClient = getQueryClient()

  // Prefetch campaign details and stats in parallel
  // Errors are handled gracefully — the client component shows not-found if campaign doesn't exist
  await Promise.allSettled([
    queryClient.prefetchQuery(getCampaignQueryOptions(id)),
    queryClient.prefetchQuery(getCampaignStatsQueryOptions(id)),
  ])

  return (
    <ContentShell>
      <Suspense fallback={<div>Loading campaign details...</div>}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CampaignDetails id={id} />
        </HydrationBoundary>
      </Suspense>
    </ContentShell>
  )
}
