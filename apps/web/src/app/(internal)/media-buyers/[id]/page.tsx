import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { MediaBuyerDetailsClient } from "./media-buyer-details-client"

interface MediaBuyerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MediaBuyerPage({ params }: MediaBuyerPageProps) {
  const { id } = await params

  const queryClient = getQueryClient()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MediaBuyerDetailsClient id={id} />
    </HydrationBoundary>
  )
}
