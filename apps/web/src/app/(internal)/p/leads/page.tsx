import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import EmpLeadsClient from "./leads-client"

export default async function PortalLeadsPage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/leads")

  const allowed = await checkPagePermission("leads.view")
  if (!allowed) return <PermissionDenied resource="leads" />

  return (
    <ContentShell>
      <PageHeader title="Leads" description="View your lead conversions with partial data masking" />
      <EmpLeadsClient />
    </ContentShell>
  )
}
