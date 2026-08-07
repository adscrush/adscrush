import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog"
import { EmployeesDataTable } from "@/features/employees/components/employees-data-table"
import { getEmployeesQueryOptions } from "@/features/employees/server-queries"
import { searchParamsCache } from "@/features/employees/validations"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface EmployeesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmployeesPage(props: EmployeesPageProps) {
  const allowed = await checkPagePermission("employees.view")
  if (!allowed) return <PermissionDenied resource="employees" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)
  
  // Use the shared getQueryClient utility for consistent SSR configuration
  const queryClient = getQueryClient()

  // Prefetch data on the server
  // This will populate the query cache with the data from the tRPC API
  await queryClient.prefetchQuery(getEmployeesQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Employees" description="Manage your employees">
        <AddEmployeeDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Employee
          </Button>
        </AddEmployeeDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              {/* Dehydrate the query client and pass it to the HydrationBoundary */}
              <HydrationBoundary state={dehydrate(queryClient)}>
                <EmployeesDataTable search={search} />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
