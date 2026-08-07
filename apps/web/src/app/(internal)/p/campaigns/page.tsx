import { type SearchParams } from "@/types"
import { portalCampaignSearchParamsCache } from "@/features/portal/validations/campaigns"
import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { Button } from "@adscrush/ui/components/button"
import { IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { EmpCampaignsClient } from "@/features/portal/components/emp-campaigns-client"

interface EmpCampaignsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmpCampaignsPage(props: EmpCampaignsPageProps) {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/campaigns")

  const allowed = await checkPagePermission("campaigns.view")
  if (!allowed) return <PermissionDenied resource="campaigns" />

  const canCreate = await checkPagePermission("campaigns.create")

  const searchParams = await props.searchParams
  const search = portalCampaignSearchParamsCache.parse(searchParams)

  return (
    <EmpCampaignsClient
      search={search}
      createAction={
        canCreate ? (
          <Button size="sm" asChild>
            <Link href="/p/campaigns/new">
              <IconPlus className="mr-2 size-3.5" />
              Create Campaign
            </Link>
          </Button>
        ) : null
      }
    />
  )
}
