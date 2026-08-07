import { ContentShell } from "@/components/common/content-shell"
import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import AdminLeadsClient from "./leads-client"
import { PageHeader } from "@/components/common/page-header"

export default async function AdminLeadsPage() {
  const allowed = await checkPagePermission("leads.view")
  if (!allowed) return <PermissionDenied resource="leads" />

  return (
    <ContentShell>
      <PageHeader title="Leads" description="View all lead conversions across media buyers and advertisers" />
      <AdminLeadsClient />
    </ContentShell>
  )
}
