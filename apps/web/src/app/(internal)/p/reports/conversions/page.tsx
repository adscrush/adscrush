import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import ConversionLogsClient from "./conversions-client"

export default async function PortalConversionLogsPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/reports/conversions")

  const allowed = await checkPagePermission("report.conversion_log_access")
  if (!allowed) return <PermissionDenied resource="conversion logs" />

  return (
    <ContentShell>
      <PageHeader title="Conversion Logs" description="View and analyze conversion events" />
      <ConversionLogsClient />
    </ContentShell>
  )
}
