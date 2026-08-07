import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { AddLanguageDialog } from "@/features/languages/components/add-language-dialog"
import { LanguagesDataTable } from "@/features/languages/components/languages-data-table"
import { getLanguagesQueryOptions } from "@/features/languages/server-queries"
import { searchParamsCache } from "@/features/languages/validations"
import { Button } from "@adscrush/ui/components/button"
import { type SearchParams } from "@/types"
import { IconPlus } from "@tabler/icons-react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { Suspense } from "react"
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider"

interface LanguagesPageProps {
  searchParams: Promise<SearchParams>
}

export default async function LanguagesPage(props: LanguagesPageProps) {
  const searchParams = await props.searchParams
  const search = searchParamsCache.parse(searchParams)

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(getLanguagesQueryOptions(search))

  return (
    <ContentShell>
      <PageHeader title="Languages" description="Manage languages for your funnels">
        <AddLanguageDialog>
          <Button size="sm">
            <IconPlus className="mr-2 size-3.5" />
            Add Language
          </Button>
        </AddLanguageDialog>
      </PageHeader>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4">
          <Suspense>
            <FeatureFlagsProvider
              defaultFilterFlag="commandFilters"
              showToggleGroup={false}
            >
              <HydrationBoundary state={dehydrate(queryClient)}>
                <LanguagesDataTable search={search} />
              </HydrationBoundary>
            </FeatureFlagsProvider>
          </Suspense>
        </div>
      </div>
    </ContentShell>
  )
}
