import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { EmpAdvertisersClient } from "@/features/portal/components/emp-advertisers-client"
import { portalAdvertiserSearchParamsCache } from "@/features/portal/validations/advertisers"
import type { SearchParams } from "@/types"

interface EmpAdvertisersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmpAdvertisersPage(props: EmpAdvertisersPageProps) {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/advertisers")

  const allowed = await checkPagePermission("advertiser.view")
  if (!allowed) return <PermissionDenied resource="advertisers" />
  const searchParams = await props.searchParams
  const search = portalAdvertiserSearchParamsCache.parse(searchParams)

  return <EmpAdvertisersClient search={search} />
}
