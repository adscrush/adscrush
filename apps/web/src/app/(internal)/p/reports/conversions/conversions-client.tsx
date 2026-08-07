"use client"

import { ConversionLogsTable } from "@/features/reports/components/conversion-logs-table"
import { trpc } from "@/lib/trpc/client"
import { useQueryStates } from "nuqs"
import { conversionLogsSearchParams } from "@/features/reports/validations"

export default function PortalConversionLogsClient() {
  const utils = trpc.useUtils()
  const [filters] = useQueryStates(conversionLogsSearchParams)

  const handleExport = async () => {
    const csv = await utils.portal.reportConversionLogExport.fetch({
      filters: filters.filters ?? [],
      joinOperator: filters.joinOperator,
    })
    return csv
  }

  return <ConversionLogsTable onExport={handleExport} exportFilename="conversion-logs" />
}
