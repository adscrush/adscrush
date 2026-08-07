import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { EmpFunnelsClient } from "@/features/portal/components/emp-funnels-client"
import { portalFunnelSearchParamsCache } from "@/features/portal/validations/funnels"
import type { SearchParams } from "@/types"

interface EmpFunnelsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmpFunnelsPage(props: EmpFunnelsPageProps) {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/funnels")

  const allowed = await checkPagePermission("funnels.view")
  if (!allowed) return <PermissionDenied resource="funnels" />
  const searchParams = await props.searchParams
  const search = portalFunnelSearchParamsCache.parse(searchParams)

  return <EmpFunnelsClient search={search} />
}
