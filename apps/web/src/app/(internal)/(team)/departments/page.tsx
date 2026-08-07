import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddDepartmentDialog } from "@/features/departments/components/add-department-dialog"
import { DepartmentsDataTable } from "@/features/departments/components/departments-data-table"
import { getDepartmentsQueryOptions } from "@/features/departments/server-queries"
import { searchParamsCache } from "@/features/departments/validations"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface DepartmentsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function DepartmentsPage(props: DepartmentsPageProps) {
  const allowed = await checkPagePermission("employees.departments_view")
  if (!allowed) return <PermissionDenied resource="departments" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)
  
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getDepartmentsQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Departments" description="Manage your departments">
        <AddDepartmentDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Department
          </Button>
        </AddDepartmentDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <DepartmentsDataTable search={search} />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
