import { getUserByIdQueryOptions } from "@/features/users/server-queries"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { UserDetailsClient } from "@/features/users/components/user-details-client"

interface UserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params

  const queryClient = getQueryClient()

  // Prefetch data on the server
  await queryClient.prefetchQuery(getUserByIdQueryOptions(id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDetailsClient id={id} />
    </HydrationBoundary>
  )
}
