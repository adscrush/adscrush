"use client"

import { EmpLeadsDataTable } from "@/features/portal/components/emp-leads-data-table"
import { trpc } from "@/lib/trpc/client"
import { useSession } from "@/lib/auth/client"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
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

export default function AdminLeadsClient() {
  const utils = trpc.useUtils()
  const [params] = useQueryStates(exportSearchParams, { shallow: true })
  const { data: session } = useSession()

  // Super admins & admins see everything — real IP, sub1-5, method, currency
  const showSensitive = isAtLeastRole(session?.user?.role ?? "", ROLES.ADMIN)

  const handleExport = async () => {
    // Match the visible table range (defaults to today)
    const { dateFrom, dateTo } = resolveLeadDateRange(params)
    const csv = await utils.leads.export.fetch({
      filters: params.filters,
      joinOperator: params.joinOperator,
      dateFrom,
      dateTo,
    })
    return csv
  }

  return (
    <EmpLeadsDataTable
      useQueryHook={trpc.leads.list.useQuery}
      showSensitive={showSensitive}
      onExport={handleExport}
      exportFilename="leads"
    />
  )
}
