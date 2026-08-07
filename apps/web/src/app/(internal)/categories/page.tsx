import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddCategoryDialog } from "@/features/categories/components/add-category-dialog"
import { CategoriesDataTable } from "@/features/categories/components/categories-data-table"
import { getCategoriesQueryOptions } from "@/features/categories/server-queries"
import { searchParamsCache } from "@/features/categories/validations"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"

interface CategoriesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function CategoriesPage(props: CategoriesPageProps) {
  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)
  
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getCategoriesQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Categories" description="Manage your offer categories">
        <AddCategoryDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Category
          </Button>
        </AddCategoryDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <CategoriesDataTable search={search} />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
