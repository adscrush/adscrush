import type { ResourceType } from "@adscrush/shared/types/data-table"

export interface FilterResourceOption {
  id: string
  name: string
  image?: string | null
}

export type FilterResourceGroup = "entity" | "clickLog" | "conversionLog"

export interface FilterResourceConfig {
  /** Group classification that determines query + mapping behavior */
  group: FilterResourceGroup
  /**
   * For clickLog / conversionLog types — the column name sent to the
   * reports options API (e.g. "source", "os", "event", "status").
   */
  column?: string
  /** For entity types — use <Avatar> instead of <img> in the list */
  useAvatar?: boolean
}

export const FILTER_RESOURCE_CONFIG: Record<string, FilterResourceConfig> = {
  // ── Entity types (fetched via X.search tRPC endpoints) ──────────────
  products: { group: "entity" },
  funnels: { group: "entity" },
  mediaBuyers: { group: "entity", useAvatar: true },
  advertisers: { group: "entity" },

  // ── Click-log report-column types ────────────────────────────────────
  clickLogSource: { group: "clickLog", column: "source" },
  clickLogPlatform: { group: "clickLog", column: "platform" },
  clickLogCountry: { group: "clickLog", column: "country" },
  clickLogDevice: { group: "clickLog", column: "deviceType" },
  clickLogOs: { group: "clickLog", column: "os" },
  clickLogBrowser: { group: "clickLog", column: "browser" },
  clickLogGeoState: { group: "clickLog", column: "geostate" },
  clickLogGeoCity: { group: "clickLog", column: "geocity" },

  // ── Conversion-log report-column types ───────────────────────────────
  conversionLogEvent: { group: "conversionLog", column: "event" },
  conversionLogStatus: { group: "conversionLog", column: "status" },
  conversionLogMethod: { group: "conversionLog", column: "method" },
  conversionLogCurrency: { group: "conversionLog", column: "currency" },
  conversionLogCountry: { group: "conversionLog", column: "country" },

} satisfies Partial<Record<ResourceType, FilterResourceConfig>>

/** Look up config for a given resource type. Returns `undefined` for custom types. */
export function getResourceConfig(resourceType: string): FilterResourceConfig | undefined {
  return FILTER_RESOURCE_CONFIG[resourceType]
}

/** Convert an entity-type search result item into a FilterResourceOption. */
export function entityToFilterOption(item: {
  id: string
  name: string
  image?: string | null
}): FilterResourceOption {
  return {
    id: item.id,
    name: item.name,
    image: "image" in item ? item.image : undefined,
  }
}

/** Convert a report-options result item (click log / conversion log) into a FilterResourceOption. */
export function reportValueToFilterOption(item: { value: string }): FilterResourceOption {
  return { id: item.value, name: item.value }
}
