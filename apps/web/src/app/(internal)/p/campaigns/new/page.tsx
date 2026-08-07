import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { PermissionDenied } from "@/components/permission-denied"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { redirect } from "next/navigation"
import { CreatePortalCampaignClient } from "./create-portal-campaign-client"

export default async function EmpCreateCampaignPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/campaigns")

  const allowed = await checkPagePermission("campaigns.create")
  if (!allowed) return <PermissionDenied resource="create campaigns" />

  return (
    <ContentShell>
      <PageHeader title="Create Campaign" description="Create a new campaign from a funnel linked to your products" />
      <div className="flex-1 pb-8">
        <CreatePortalCampaignClient />
      </div>
    </ContentShell>
  )
}
