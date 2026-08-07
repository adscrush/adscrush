"use client"

import { EmpLeadsDataTable } from "@/features/portal/components/emp-leads-data-table"
import { trpc } from "@/lib/trpc/client"
import { useQueryStates } from "nuqs"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"
import { parseAsString, parseAsStringEnum } from "nuqs"
import { resolveLeadDateRange } from "@/features/portal/utils/lead-date-range"

// Must match the search params in EmpLeadsDataTable
const exportSearchParams = {
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  dateFrom: parseAsString,
  dateTo: parseAsString,
}

export default function EmpLeadsClient() {
  const utils = trpc.useUtils()
  const [params] = useQueryStates(exportSearchParams, { shallow: true })

  const handleExport = async () => {
    // Match the visible table range (defaults to today)
    const { dateFrom, dateTo } = resolveLeadDateRange(params)
    const csv = await utils.portal.myLeadsExport.fetch({
      filters: params.filters,
      joinOperator: params.joinOperator,
      dateFrom,
      dateTo,
    })
    return csv
  }

  return (
    <EmpLeadsDataTable
      useQueryHook={trpc.portal.myLeads.useQuery}
      hideColumns={["mediaBuyerId", "advertiserId"]}
      onExport={handleExport}
      exportFilename="my-leads"
    />
  )
}
