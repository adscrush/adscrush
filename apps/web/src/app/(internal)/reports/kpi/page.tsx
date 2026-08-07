import { ContentShell } from "@/components/common/content-shell"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { KpiReportsClient } from "@/features/reports-kpi/components/kpi-reports-client"

export default async function ReportsKpiPage() {
  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="reports" />

  return (
    <ContentShell>
      <KpiReportsClient />
    </ContentShell>
  )
}
