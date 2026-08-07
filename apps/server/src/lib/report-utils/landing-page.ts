import { and, eq, ilike, isNull, or, sql } from "@adscrush/db/drizzle"
import { clicks, landingPages } from "@adscrush/db/schema"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"
import type { Database } from "@adscrush/db"

export const KPI_FILTER_TABLE = {
  ...clicks,
  country: clicks.geoCountry,
  geoState: clicks.geoState,
  geoCity: clicks.geoCity,
  deviceType: clicks.deviceType,
  tid: clicks.tid,
  campaignId: clicks.campaignId,
  funnelId: clicks.funnelId,
  creativeId: clicks.creativeName,
  landingPageId: clicks.landingPageId,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFilter = ExtendedColumnFilter<any>

export async function resolveLandingPageFilters(
  db: Database,
  filters: AnyFilter[] | undefined,
): Promise<AnyFilter[] | undefined> {
  if (!filters || filters.length === 0) return filters

  const lpFilters = filters.filter((f) => f.id === "landingPageId")
  if (lpFilters.length === 0) return filters

  const nonLpFilters = filters.filter((f) => f.id !== "landingPageId")
  const resolved: AnyFilter[] = [...nonLpFilters]

  for (const lpFilter of lpFilters) {
    const values = Array.isArray(lpFilter.value)
      ? lpFilter.value.filter((v): v is string => typeof v === "string" && v.length > 0)
      : typeof lpFilter.value === "string" && lpFilter.value.length > 0
        ? [lpFilter.value]
        : []

    if (values.length === 0) continue

    let conditions
    if (lpFilter.operator === "eq") {
      conditions = or(
        ...values.map((v) => sql`lower(${landingPages.name}) = lower(${v})`),
      )
    } else {
      conditions = or(
        ...values.map((v) => ilike(landingPages.name, `%${v}%`)),
      )
    }

    const matchingPages = await db
      .select({ id: landingPages.id })
      .from(landingPages)
      .where(and(conditions, eq(landingPages.status, "active"), isNull(landingPages.deletedAt)))
      .limit(100)

    const pageIds = matchingPages.map((p) => p.id).filter(Boolean)

    if (pageIds.length === 0) {
      resolved.push({
        id: "landingPageId",
        value: ["__no_match__"],
        variant: "multiSelect",
        operator: "inArray",
        filterId: lpFilter.filterId,
      })
    } else {
      resolved.push({
        ...lpFilter,
        value: pageIds,
        operator: "inArray",
      })
    }
  }

  return resolved
}
