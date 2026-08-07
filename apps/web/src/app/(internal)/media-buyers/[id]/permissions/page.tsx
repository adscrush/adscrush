import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { MediaBuyerPermissionsClient } from "@/features/media-buyers/components/media-buyer-permissions-client"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface PermissionsPageProps {
  params: Promise<{ id: string }>
}

export default async function MediaBuyerPermissionsPage({ params }: PermissionsPageProps) {
  const allowed = await checkPagePermission("media_buyers.edit")
  if (!allowed) return <PermissionDenied resource="media buyer permissions" />

  const { id } = await params

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <MediaBuyerPermissionsClient mediaBuyerId={id} />
    </HydrationBoundary>
  )
}
