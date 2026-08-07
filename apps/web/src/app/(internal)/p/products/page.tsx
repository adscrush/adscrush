import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { EmpProductsClient } from "@/features/portal/components/emp-products-client"
import { portalProductSearchParamsCache } from "@/features/portal/validations/products"
import type { SearchParams } from "@/types"

interface EmpProductsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmpProductsPage(props: EmpProductsPageProps) {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/products")

  const allowed = await checkPagePermission("products.view")
  if (!allowed) return <PermissionDenied resource="products" />
  const searchParams = await props.searchParams
  const search = portalProductSearchParamsCache.parse(searchParams)

  return <EmpProductsClient search={search} />
}
