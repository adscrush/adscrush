import { ContentShell } from "@/components/common/content-shell"
import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import ClickLogsPageClient from "./clicks-client"
import { PageHeader } from "@/components/common/page-header"

export default async function ClickLogsPage() {
  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="click logs" />

  return (
    <ContentShell>
      <PageHeader title="Click Logs" description="View and analyze click logs" />
      <ClickLogsPageClient />
    </ContentShell>
  )
}
