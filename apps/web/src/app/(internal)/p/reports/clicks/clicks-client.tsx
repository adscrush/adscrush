"use client"

import { ClickLogsTable } from "@/features/reports/components/click-logs-table"
import { usePortalClickLogs } from "@/features/reports/portal-queries"
import { trpc } from "@/lib/trpc/client"
import { useQueryStates } from "nuqs"
import { clickLogsSearchParams } from "@/features/reports/validations"

export default function PortalClickLogsClient() {
  const utils = trpc.useUtils()
  const [filters] = useQueryStates(clickLogsSearchParams)

  const handleExport = async () => {
    const csv = await utils.portal.reportClickLogExport.fetch({
      filters: filters.filters ?? [],
      joinOperator: filters.joinOperator,
    })
    return csv
  }

  return (
    <ClickLogsTable
      useQueryHook={usePortalClickLogs}
      hideColumns={["mediaBuyer", "advertiser"]}
      onExport={handleExport}
      exportFilename="click-logs"
    />
  )
}
