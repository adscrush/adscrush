import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { OrphanPanel } from "@/components/media/orphan-panel"
import { auth } from "@/lib/auth/server"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function MediaAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/auth/sign-in")
  if (!isAtLeastRole(session.user.role, ROLES.ADMIN)) redirect("/media")

  return (
    <ContentShell>
      <PageHeader
        title="Media Admin"
        description="Orphan detection tools"
      />
      <OrphanPanel />
    </ContentShell>
  )
}
