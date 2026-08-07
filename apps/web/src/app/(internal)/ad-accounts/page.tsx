import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddAdAccountDialog } from "@/features/ad-accounts/components/add-ad-account-dialog"
import { ImportAdAccountsDialog } from "@/features/ad-accounts/components/import-ad-accounts-dialog"
import { AdAccountsDataTable } from "@/features/ad-accounts/components/ad-accounts-data-table"
import { getAdAccountsQueryOptions } from "@/features/ad-accounts/server-queries"
import { searchParamsCache } from "@/features/ad-accounts/validations"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus, IconUpload } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { checkPagePermission } from "@/lib/auth/check-page-permission"
import { PermissionDenied } from "@/components/permission-denied"

interface AdAccountsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AdAccountsPage(props: AdAccountsPageProps) {
  const allowed = await checkPagePermission("ad_accounts.view")
  if (!allowed) return <PermissionDenied resource="ad accounts" />

  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(getAdAccountsQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Ad Accounts" description="Manage your ad accounts">
        <ImportAdAccountsDialog>
          <Button variant="outline" size="sm">
            <IconUpload className="mr-2 size-3.5" />
            Import
          </Button>
        </ImportAdAccountsDialog>
        <AddAdAccountDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Ad Account
          </Button>
        </AddAdAccountDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <AdAccountsDataTable
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
