"use client"

import { usePortalLogsReport, usePortalPerformanceCount } from "@/features/reports/portal-queries"
import { KpiReportsClient } from "@/features/reports-kpi/components/kpi-reports-client"
import type { KpiQueryHooks } from "@/features/reports-kpi/components/kpi-reports-client"

const portalQueryHooks: KpiQueryHooks = {
  usePerformanceQuery: usePortalLogsReport as unknown as KpiQueryHooks["usePerformanceQuery"],
  usePerformanceCountQuery: usePortalPerformanceCount as unknown as KpiQueryHooks["usePerformanceCountQuery"],
}

export function PortalKpiReportsClient() {
  return <KpiReportsClient queryHooks={portalQueryHooks} />
}
