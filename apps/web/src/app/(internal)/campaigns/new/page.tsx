import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { CreateCampaignClient } from "./create-campaign-client"

export default async function CreateCampaignPage() {
  const allowed = await checkPagePermission("campaigns.create")
  if (!allowed) return <PermissionDenied resource="create campaigns" />

  return (
    <ContentShell>
      <PageHeader
        title="Create Campaign"
        description="Create a new advertising campaign linked to a funnel"
      />
      <div className="flex-1 pb-8">
        <CreateCampaignClient />
      </div>
    </ContentShell>
  )
}
