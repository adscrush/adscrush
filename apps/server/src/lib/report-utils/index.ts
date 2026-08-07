/**
 * Report utilities — organized by concern.
 *
 * - `date.ts`     — Date range helpers (getRange)
 * - `ip.ts`       — IP decryption (safeDecryptIp)
 * - `landing-page.ts` — Landing page filter resolution (resolveLandingPageFilters, KPI_FILTER_TABLE)
 * - `registry.ts` — Constants, types, and helpers (TopField, BreakdownField, GroupByColumns, etc.)
 * - `performance.ts` — Performance query executor (runPerformanceQuery, runPerformanceCountQuery, etc.)
 * - `overview.ts`  — Overview and trend queries (runOverviewQuery, runTrendQuery)
 */

export { getRange } from "./date"
export { safeDecryptIp } from "./ip"
export { resolveLandingPageFilters, KPI_FILTER_TABLE } from "./landing-page"
export {
  type BreakdownField,
  BREAKDOWN_FIELDS,
  type TopField,
  TOP_FIELD_SELF_GROUP,
  TOP_FIELD_COL_MAP,
  NULL_GROUP_KEY,
  rowGroupKey,
  type GroupByColumns,
  getGroupByColumns,
  type PerformanceResultRow,
  type PerformanceQueryRow,
  type PerformanceQueryOptions,
  type TableLike,
} from "./registry"
export {
  buildPerformanceResult,
  fetchAdAccountSpend,
  runPerformanceQuery,
  runPerformanceCountQuery,
} from "./performance"
export { runOverviewQuery, runTrendQuery } from "./overview"
