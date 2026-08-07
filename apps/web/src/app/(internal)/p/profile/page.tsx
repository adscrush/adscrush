import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { ContentShell } from "@/components/common/content-shell"
import { ProfileClient } from "@/app/(internal)/profile/profile-client"

export default async function EmpProfilePage() {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/dashboard")

  return (
    <ContentShell>
      <ProfileClient />
    </ContentShell>
  )
}
