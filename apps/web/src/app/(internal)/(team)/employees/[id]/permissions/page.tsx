import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getEmployeeByIdQueryOptions } from "@/features/employees/server-queries"
import { EmployeePermissionsClient } from "@/features/employees/components/employee-permissions-client"
import { getTrpcServer } from "@/lib/trpc/server"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface PermissionsPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeePermissionsPage({ params }: PermissionsPageProps) {
  const allowed = await checkPagePermission("employees.manage")
  if (!allowed) return <PermissionDenied resource="employee permissions" />

  const { id } = await params
  const queryClient = getQueryClient()
  const trpc = getTrpcServer()

  // Prefetch both the employee record and their permissions.
  // We use trpc.employees.getPermissions directly so the query key matches
  // what the client-side trpc hook generates — ensuring hydration works correctly.
  await Promise.all([
    queryClient.prefetchQuery(getEmployeeByIdQueryOptions(id)),
    queryClient.prefetchQuery({
      // This key must match what trpc.employees.getPermissions.useQuery generates on the client.
      // tRPC React Query uses: ["trpc", "employees", "getPermissions", { input, type }]
      // We use the proxy client here so the key is consistent.
      queryKey: [["employees", "getPermissions"], { input: { employeeId: id }, type: "query" }],
      queryFn: () => trpc.employees.getPermissions.query({ employeeId: id }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeePermissionsClient employeeId={id} />
    </HydrationBoundary>
  )
}
