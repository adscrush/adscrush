"use client"

import { ConversionLogsTable } from "@/features/reports/components/conversion-logs-table"
import { trpc } from "@/lib/trpc/client"

export default function ConversionLogsPageClient() {
  const utils = trpc.useUtils()

  const handleExport = async () => {
    const csv = await utils.reports.export.fetch({
      type: "conversionLog",
      period: "this_month",
    })
    return csv
  }

  return <ConversionLogsTable onExport={handleExport} exportFilename="admin-conversion-logs" />
}
