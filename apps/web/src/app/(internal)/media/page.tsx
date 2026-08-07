import { MediaLibraryContent } from "@/components/media/media-library-content"
import { Suspense } from "react"

export default async function MediaLibraryPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Suspense>
        <MediaLibraryContent />
      </Suspense>
    </div>
  )
}
