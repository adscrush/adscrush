import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { ProductsDataTable } from "@/features/products/components/products-data-table"
import { getProductsQueryOptions } from "@/features/products/server-queries"
import { searchParamsCache } from "@/features/products/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { Button } from "@adscrush/ui/components/button"
import type { SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import Link from "next/link"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage(props: ProductsPageProps) {
  const allowed = await checkPagePermission("products.view")
  if (!allowed) return <PermissionDenied resource="products" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getProductsQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Products" description="Manage your products">
        <Button size="sm" asChild>
          <Link href="/products/new">
            <IconPlus className="mr-2 size-3.5" />
            Add Product
          </Link>
        </Button>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <ProductsDataTable
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
