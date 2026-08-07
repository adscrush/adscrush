"use client"

import { ClickLogsTable } from "@/features/reports/components/click-logs-table"
import { useClickLogs } from "@/features/reports/queries"
import { trpc } from "@/lib/trpc/client"

export default function ClickLogsPageClient() {
  const utils = trpc.useUtils()

  const handleExport = async () => {
    const csv = await utils.reports.export.fetch({
      type: "clickLog",
      period: "this_month",
    })
    return csv
  }

  return (
    <ClickLogsTable
      useQueryHook={useClickLogs}
      onExport={handleExport}
      exportFilename="admin-click-logs"
    />
  )
}
