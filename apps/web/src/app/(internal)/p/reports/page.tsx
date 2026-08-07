import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { ContentShell } from "@/components/common/content-shell"
import ReportsClient from "./reports-client"

export default async function PortalReportsPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/reports")

  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="reports" />

  return (
    <ContentShell>
      <ReportsClient />
    </ContentShell>
  )
}
