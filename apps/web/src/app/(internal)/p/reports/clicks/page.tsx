import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import ClickLogsClient from "./clicks-client"

export default async function PortalClickLogsPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/reports/clicks")

  const allowed = await checkPagePermission("report.click_log_access")
  if (!allowed) return <PermissionDenied resource="click logs" />

  return (
    <ContentShell>
      <PageHeader title="Click Logs" description="View and analyze click logs" />
      <ClickLogsClient />
    </ContentShell>
  )
}
