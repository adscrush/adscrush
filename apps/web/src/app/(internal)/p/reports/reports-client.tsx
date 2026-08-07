"use client"

import { LogsReportTable } from "@/features/reports/components/logs-report-table"
import { SummaryStats } from "@/features/reports/components/summary-stats"
import { usePortalReportOverview, usePortalReportTrend, usePortalLogsReport } from "@/features/reports/portal-queries"
import { ReportsToolbar } from "@/features/reports/components/reports-toolbar"
import { PageHeader } from "@/components/common/page-header"

function PortalSummaryStatsWrapper() {
  const { data: overview, isLoading: isOverviewLoading } = usePortalReportOverview({ period: "this_month" })
  const { data: trendData, isLoading: isTrendLoading } = usePortalReportTrend({ period: "this_month" })
  return (
    <SummaryStats
      overview={overview}
      trendData={trendData}
      isLoading={isOverviewLoading || isTrendLoading}
    />
  )
}

export default function PortalReportsClient() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title="Reports"
        description="Detailed performance analysis and logs."
      />

      <ReportsToolbar />
      <PortalSummaryStatsWrapper />
      <LogsReportTable
        usePerformanceQuery={usePortalLogsReport}
        showExport={false}
        showAiAnalyze={false}
      />
    </div>
  )
}
