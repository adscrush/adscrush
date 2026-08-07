import { Suspense } from "react"
import { ContentShell } from "@/components/common/content-shell"
import { PermissionDenied } from "@/components/permission-denied"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { redirect } from "next/navigation"
import { PortalCampaignDetailClient } from "./portal-campaign-detail-client"

interface PortalCampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PortalCampaignDetailPage({ params }: PortalCampaignDetailPageProps) {
  const { id } = await params

  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/campaigns")

  const allowed = await checkPagePermission("campaigns.view")
  if (!allowed) return <PermissionDenied resource="this campaign" />

  // Creators (holding `campaigns.create`) can edit their own campaigns even
  // without the separate `campaigns.edit` permission. Array form resolves the
  // buyer's permission set once for the any-of check.
  const canEdit = await checkPagePermission(["campaigns.edit", "campaigns.create"])

  return (
    <ContentShell>
      <Suspense fallback={<div>Loading campaign details...</div>}>
        <PortalCampaignDetailClient id={id} canEdit={canEdit} />
      </Suspense>
    </ContentShell>
  )
}
