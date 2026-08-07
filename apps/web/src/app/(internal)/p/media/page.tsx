import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { MediaLibraryContent } from "@/components/media/media-library-content"
import { Suspense } from "react"

export default async function EmpMediaPage() {
  const { isBuyer, userId } = await requireMediaBuyer()
  if (!isBuyer) redirect("/media")

  const allowed = await checkPagePermission("media.upload")
  if (!allowed) return <PermissionDenied resource="media" />

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Suspense>
        <MediaLibraryContent uploadedBy={userId} />
      </Suspense>
    </div>
  )
}
