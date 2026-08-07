import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { getQueryClient } from "@/lib/query-client"
import { getAdvertisersQueryOptions } from "@/features/advertisers/server-queries"
import { getCategoriesQueryOptions } from "@/features/categories/server-queries"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { EditProductForm } from "@/features/products/components/edit-product-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const allowed = await checkPagePermission("products.edit")
  if (!allowed) return <PermissionDenied resource="products" />

  const { id } = await params
  const queryClient = getQueryClient()

  // Prefetch data for the form's vendor/category comboboxes
  await Promise.all([
    queryClient.prefetchQuery(
      getAdvertisersQueryOptions({
        page: 1,
        perPage: 50,
        sort: [{ id: "createdAt", desc: true }],
        filters: [],
        joinOperator: "and",
        filterFlag: "commandFilters",
        name: "",
        status: [],
        createdAt: [],
      })
    ),
    queryClient.prefetchQuery(
      getCategoriesQueryOptions({
        page: 1,
        perPage: 50,
        sort: [{ id: "createdAt", desc: true }],
        filters: [],
        joinOperator: "and",
        filterFlag: "commandFilters",
        search: "",
      })
    ),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditProductForm productId={id} />
    </HydrationBoundary>
  )
}
