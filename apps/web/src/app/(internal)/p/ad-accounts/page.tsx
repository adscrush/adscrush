import { redirect } from "next/navigation"
import { requireMediaBuyer } from "@/lib/auth/check-media-buyer"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"
import { EmpAdAccountsClient } from "@/features/portal/components/emp-ad-accounts-client"
import { portalAdAccountSearchParamsCache } from "@/features/portal/validations/ad-accounts"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import type { SearchParams } from "@/types"

interface EmpAdAccountsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EmpAdAccountsPage(props: EmpAdAccountsPageProps) {
  const { isBuyer } = await requireMediaBuyer()
  if (!isBuyer) redirect("/ad-accounts")

  const allowed = await checkPagePermission("ad_accounts.view")
  if (!allowed) return <PermissionDenied resource="ad accounts" />

  const searchParams = await props.searchParams
  const search = portalAdAccountSearchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: ["portalAdAccounts", "list", { params: search }],
    queryFn: async () => {
      const { getTrpcServer } = await import("@/lib/trpc/server")
      const trpc = getTrpcServer()
      const result = await trpc.portal.myAdAccountsList.query(search)
      return { data: result.items, pageCount: result.pageCount, meta: { total: result.total } }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmpAdAccountsClient search={search} />
    </HydrationBoundary>
  )
}
