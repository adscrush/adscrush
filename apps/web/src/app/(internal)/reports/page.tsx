import { ContentShell } from "@/components/common/content-shell"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import ReportsPageClient from "./reports-client"

export default async function ReportsPage() {
  const allowed = await checkPagePermission("report.view")
  if (!allowed) return <PermissionDenied resource="reports" />

  return (
    <ContentShell>
      <ReportsPageClient />
    </ContentShell>
  )
}
