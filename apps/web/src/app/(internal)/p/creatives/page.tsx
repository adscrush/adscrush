import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { EmpCreativesClient } from "@/features/portal/components/emp-creatives-client"

export default async function EmpCreativesPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/creatives")

  const allowed = await checkPagePermission("creatives.view")
  if (!allowed) return <PermissionDenied resource="creatives" />

  return <EmpCreativesClient />
}
