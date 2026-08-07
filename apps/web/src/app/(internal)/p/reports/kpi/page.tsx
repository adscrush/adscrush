import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { ContentShell } from "@/components/common/content-shell"
import { PortalKpiReportsClient } from "./kpi-client"

export default async function PortalReportsKpiPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/reports/kpi")

  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="reports" />

  return (
    <ContentShell>
      <PortalKpiReportsClient />
    </ContentShell>
  )
}
