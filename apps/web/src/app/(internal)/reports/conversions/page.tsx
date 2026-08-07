import { ContentShell } from "@/components/common/content-shell"
import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PageHeader } from "@/components/common/page-header"
import ConversionLogsPageClient from "./conversions-client"

export default async function ConversionLogsPage() {
  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="conversion logs" />

  return (
    <ContentShell>
      <PageHeader title="Conversion Logs" description="View and analyze conversion events" />
      <ConversionLogsPageClient />
    </ContentShell>
  )
}
