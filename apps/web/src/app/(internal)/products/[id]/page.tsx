import { PermissionDenied } from "@/components/permission-denied"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getProductByIdQueryOptions } from "@/features/products/server-queries"
import { ProductDetail } from "@/features/products/components/product-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const allowed = await checkPagePermission("products.view")
  if (!allowed) return <PermissionDenied resource="products" />

  const { id } = await params
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getProductByIdQueryOptions(id))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetail productId={id} />
    </HydrationBoundary>
  )
}
