import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { UsersDataTable } from "@/features/users/components/users-data-table"
import { getUsersQueryOptions } from "@/features/users/server-queries"
import { searchParamsCache } from "@/features/users/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { type SearchParams } from "@/types"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface UsersPageProps {
  searchParams: Promise<SearchParams>
}

export default async function UsersPage(props: UsersPageProps) {
  const allowed = await checkPagePermission("employees.view")
  if (!allowed) return <PermissionDenied resource="users" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  // Use the shared getQueryClient utility for consistent SSR configuration
  const queryClient = getQueryClient()

  // Prefetch data on the server
  await queryClient.prefetchQuery(getUsersQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader
        title="Users"
        description="View all registered users on the platform"
      />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <UsersDataTable
                  search={search}
                  queryKeys={{
                    page: "page",
                    perPage: "perPage",
                    sort: "sort",
                    filters: "filters",
                    joinOperator: "joinOperator",
                  }}
                />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
