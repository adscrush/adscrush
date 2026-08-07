import { getEmployeeByIdQueryOptions } from "@/features/employees/server-queries"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { EmployeeDetailsClient } from "./employee-details-client"

interface EmployeePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EmployeePage({ params }: EmployeePageProps) {
  const { id } = await params
  
  const queryClient = getQueryClient()

  // Prefetch data on the server
  await queryClient.prefetchQuery(getEmployeeByIdQueryOptions(id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeeDetailsClient id={id} />
    </HydrationBoundary>
  )
}
