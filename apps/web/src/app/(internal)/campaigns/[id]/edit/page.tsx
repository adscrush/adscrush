import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { getQueryClient } from "@/lib/query-client"
import { getCampaignQueryOptions } from "@/features/campaigns/server-queries"
import { EditCampaignClient } from "./edit-campaign-client"

interface EditCampaignPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params

  const allowed = await checkPagePermission("campaigns.edit")
  if (!allowed) return <PermissionDenied resource="edit campaigns" />

  const queryClient = getQueryClient()

  // Prefetch campaign data for the edit form
  await queryClient.prefetchQuery(getCampaignQueryOptions(id))

  // Extract funnel name from prefetched data for display
  const campaignData = queryClient.getQueryData<{ data: { funnel?: { name: string } | null } }>(
    ["campaigns", "detail", id]
  )
  const funnelName = campaignData?.data?.funnel?.name ?? undefined

  return (
    <ContentShell>
      <PageHeader
        title="Edit Campaign"
        description="Update campaign details and configuration"
      />
      <div className="flex-1 pb-8">
        <Suspense fallback={<div>Loading...</div>}>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <EditCampaignClient id={id} funnelName={funnelName} />
          </HydrationBoundary>
        </Suspense>
      </div>
    </ContentShell>
  )
}
