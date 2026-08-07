"use client"

import { LogsReportTable } from "@/features/reports/components/logs-report-table"
import { SummaryStats } from "@/features/reports/components/summary-stats"
import { useLogsReport, useReportOverview, useReportTrend } from "@/features/reports/queries"
import { ReportsToolbar } from "@/features/reports/components/reports-toolbar"
import { PageHeader } from "@/components/common/page-header"

function ReportsSummaryStats() {
  const { data: overview, isLoading: isOverviewLoading } = useReportOverview({ period: "this_month" })
  const { data: trendData, isLoading: isTrendLoading } = useReportTrend({ period: "this_month" })
  return (
    <SummaryStats
      overview={overview}
      trendData={trendData}
      isLoading={isOverviewLoading || isTrendLoading}
    />
  )
}

export default function ReportsPageClient() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title="Reports"
        description="Detailed performance analysis and logs."
      />

      <ReportsToolbar />
      <ReportsSummaryStats />
      <LogsReportTable
        usePerformanceQuery={useLogsReport}
        showExport
        showAiAnalyze
      />
    </div>
  )
}
