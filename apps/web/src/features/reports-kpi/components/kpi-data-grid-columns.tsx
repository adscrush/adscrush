"use client"

import { createColumnHelper } from "@tanstack/react-table"
import type { ColumnSizingState } from "@tanstack/react-table"
import { type AnyColumnDef } from "@/types"
import { getInitials } from "@adscrush/shared/lib/initials"
import { formatCurrency, formatPercent } from "../utils"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { DataGridColumnHeader } from "@adscrush/ui/components/reui/data-grid"

import {
  Globe,
  Monitor,
  Smartphone,
  Link2,
  Hash,
  Flag,
  Layers,
  FileText,
  Image,
  MapPin,
  Building2,
  Network,
  Code2,
  AppWindowMac,
  Cpu,
  Workflow,
  ExternalLink,
  Tags,
} from "lucide-react"

// --- Types ---

export type GroupByValue = "campaign" | "product" | "advertiser" | "mediaBuyer" | "adAccount"

export interface KpiRow {
  id: string
  name: string
  clicks: number
  uniqueClicks: number
  conversions: number
  approvedConversions: number
  revenue: number
  payout: number
  profit: number
  cr: number
  rpc: number
  epc: number
  spend?: number
  roas?: number
  country?: string | null
  device?: string | null
  ip?: string | null
  source?: string | null
  sourcePlatform?: string | null
  os?: string | null
  osVersion?: string | null
  browser?: string | null
  browserVersion?: string | null
  deviceType?: string | null
  deviceVendor?: string | null
  deviceModel?: string | null
  geoState?: string | null
  geoCity?: string | null
  referer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
  campaignName?: string | null
  funnelName?: string | null
  landingPageName?: string | null
  countryName?: string | null
  geoStateName?: string | null
  geoCityName?: string | null
  browserName?: string | null
  deviceName?: string | null
  osName?: string | null
  sourceName?: string | null
  creativeName?: string | null
  tidName?: string | null
  mediaBuyerName?: string | null
  adAccountName?: string | null
}

// --- Constants ---

export const STORAGE_KEY = "kpi-grid-column-widths"
export const MIN_COLUMN_WIDTH = 60

export const BASE_COLUMN_IDS = [
  "name",
  "clicks",
  "uniqueClicks",
  "conversions",
  "approvedConversions",
  "revenue",
  "payout",
  "profit",
  "cr",
  "rpc",
  "epc",
]

export const AD_ACCOUNT_COLUMN_IDS = ["spend", "roas"]
export const PRODUCT_COLUMN_IDS = ["country", "device", "browser"]

export const HIDDEN_ATTRIBUTE_COLUMN_IDS = [
  "ip",
  "source",
  "sourcePlatform",
  "os",
  "osVersion",
  "topBrowser",
  "browserVersion",
  "deviceType",
  "topDevice",
  "deviceVendor",
  "deviceModel",
  "geoState",
  "geoCity",
  "referer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
]

export const FILTER_ONLY_COLUMN_IDS = [
  "campaignId",
  "funnelId",
  "creativeId",
  "tid",
  "landingPageId",
]

/** Maps a breakdown field ID to its display label. */
export const BREAKDOWN_LABELS: Record<string, string> = {
  campaign: "Campaign",
  funnel: "Funnel",
  landingPage: "Landing Page",
  country: "Country",
  geoState: "Geo State",
  geoCity: "Geo City",
  browser: "Browser",
  device: "Device",
  os: "OS",
  source: "Source",
  creative: "Creative",
  tid: "Tracking ID / Click ID",
  mediaBuyer: "Media Buyer",
  adAccount: "Ad Account",
}

// --- LocalStorage helpers ---

export function loadColumnWidths(): ColumnSizingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, number>
      const validated: ColumnSizingState = {}
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "number" && value >= MIN_COLUMN_WIDTH) {
          validated[key] = value
        }
      }
      return validated
    }
  } catch {
    // localStorage unavailable or corrupted
  }
  return {}
}

export function saveColumnWidths(sizing: ColumnSizingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizing))
  } catch {
    // localStorage unavailable
  }
}

// --- Column Builder ---

const columnHelper = createColumnHelper<KpiRow>()

export function buildKpiColumns(
  activeTab: GroupByValue,
  productImageMap: Map<string, string | null>,
  breakdownBy: string[],
) {
  const cols: AnyColumnDef<KpiRow>[] = [
    columnHelper.accessor("name", {
      id: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Name" pinnable />
      ),
      cell: ({ getValue, row }) => {
        const name = getValue()
        const id = row.original.id

        if (activeTab === "mediaBuyer") {
          return (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-5 shrink-0">
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(name || id)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[11px] font-medium">
                {name || id}
              </span>
            </div>
          )
        }

        if (activeTab === "product") {
          const productId = id ? id.split("::")[0] ?? id : id
          const productName = name ? name.split(" / ")[0] ?? name : name
          const image = productImageMap.get(productId)
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="size-6 shrink-0 overflow-hidden rounded-md border bg-muted">
                {image ? (
                  <img
                    src={image}
                    alt={productName || productId}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[9px] font-medium text-muted-foreground">
                    {(productName || productId || "").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[11px] font-medium leading-tight">
                  {productName || productId}
                </span>
              </div>
            </div>
          )
        }

        return (
          <div className="truncate text-[11px] font-medium">{name}</div>
        )
      },
      size: 220,
      minSize: MIN_COLUMN_WIDTH,
      enableHiding: false,
      meta: { headerTitle: "Name" },
    }),

    // --- Metric columns ---
    columnHelper.accessor("clicks", {
      id: "clicks",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Clicks" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {Number(getValue() || 0).toLocaleString()}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Clicks", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("uniqueClicks", {
      id: "uniqueClicks",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Unique Clicks" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {Number(getValue() || 0).toLocaleString()}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Unique Clicks", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("conversions", {
      id: "conversions",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Conversions" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {Number(getValue() || 0).toLocaleString()}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Conversions", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("approvedConversions", {
      id: "approvedConversions",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Approved" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {Number(getValue() || 0).toLocaleString()}
        </div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Approved Conversions", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("revenue", {
      id: "revenue",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Revenue" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Revenue", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("payout", {
      id: "payout",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Payout" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Payout", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("profit", {
      id: "profit",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Profit" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums text-primary">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Profit", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("cr", {
      id: "cr",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="CR" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatPercent(Number(getValue() || 0))}
        </div>
      ),
      size: 80, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "CR", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("rpc", {
      id: "rpc",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="RPC" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "RPC", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("epc", {
      id: "epc",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="EPC" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "EPC", headerClassName: "text-right", cellClassName: "text-right" },
    }),
  ]

  // --- Dynamic breakdown columns (from breakdownBy) ---
  for (const field of breakdownBy) {
    const key = `${field}Name`
    const label = BREAKDOWN_LABELS[field] || field

    cols.push(
      columnHelper.accessor(key as keyof KpiRow, {
        id: key,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={label} pinnable />
        ),
        cell: ({ getValue }) => {
          const val = getValue()
          const display = val != null ? String(val) : "—"
          if (field === "mediaBuyer") {
            return (
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-5 shrink-0">
                  <AvatarFallback className="text-[0.5rem]">
                    {getInitials(display)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[11px] font-medium text-muted-foreground">
                  {display}
                </span>
              </div>
            )
          }
          return (
            <div className="truncate text-[11px] text-muted-foreground">
              {display}
            </div>
          )
        },
        size: 150,
        minSize: MIN_COLUMN_WIDTH,
        meta: { headerTitle: label },
      })
    )
  }

  // --- Always-defined display columns ---
  cols.push(
    columnHelper.accessor("country", {
      id: "country",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Country" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Country", label: "Country", variant: "multiSelect", icon: Globe,
        dynamicOptions: { resourceType: "clickLogCountry", fetchFn: undefined } },
    }),
    columnHelper.accessor("device", {
      id: "device",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Device" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 110, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Device" },
    }),
    columnHelper.display({
      id: "browser",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Browser" pinnable />
      ),
      cell: ({ row }) => {
        if (activeTab === "product") {
          const name = row.original.name
          const parts = name ? name.split(" / ") : []
          return (
            <div className="truncate text-[11px] text-muted-foreground">
              {(parts.length >= 3 ? parts.slice(-1)[0] : "") || "—"}
            </div>
          )
        }
        return (
          <div className="truncate text-[11px] text-muted-foreground">
            {row.original.browser || "—"}
          </div>
        )
      },
      size: 110, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Browser", label: "Browser", variant: "multiSelect", icon: Monitor,
        dynamicOptions: { resourceType: "clickLogBrowser", fetchFn: undefined } },
    }),
    columnHelper.accessor("spend", {
      id: "spend",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Spend" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatCurrency(Number(getValue() || 0))}
        </div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Spend", headerClassName: "text-right", cellClassName: "text-right" },
    }),
    columnHelper.accessor("roas", {
      id: "roas",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="ROAS" className="justify-end" pinnable />
      ),
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-[11px] tabular-nums">
          {formatPercent(Number(getValue() || 0))}
        </div>
      ),
      size: 80, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "ROAS", headerClassName: "text-right", cellClassName: "text-right" },
    }),
  )

  // --- Hidden attribute display columns ---
  cols.push(
    columnHelper.accessor("ip", {
      id: "ip",
      header: ({ column }) => <DataGridColumnHeader column={column} title="IP Address" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate font-mono text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 150, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "IP Address", label: "IP Address", icon: Globe },
    }),
    columnHelper.accessor("source", {
      id: "source",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Source" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Source", label: "Source", variant: "multiSelect", icon: Link2,
        dynamicOptions: { resourceType: "clickLogSource", fetchFn: undefined } },
    }),
    columnHelper.accessor("sourcePlatform", {
      id: "sourcePlatform",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Platform" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Platform", label: "Platform", variant: "multiSelect", icon: Network,
        dynamicOptions: { resourceType: "clickLogPlatform", fetchFn: undefined } },
    }),
    columnHelper.accessor("os", {
      id: "os",
      header: ({ column }) => <DataGridColumnHeader column={column} title="OS" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "OS", label: "OS", variant: "multiSelect", icon: Monitor,
        dynamicOptions: { resourceType: "clickLogOs", fetchFn: undefined } },
    }),
    columnHelper.accessor("osVersion", {
      id: "osVersion",
      header: ({ column }) => <DataGridColumnHeader column={column} title="OS Version" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 110, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "OS Version", label: "OS Version", icon: Code2 },
    }),
    columnHelper.accessor("browserVersion", {
      id: "browserVersion",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Browser Version" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Browser Version", label: "Browser Version", variant: "multiSelect", icon: AppWindowMac },
    }),
    columnHelper.accessor("deviceType", {
      id: "deviceType",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Device Type" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 110, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Device Type", label: "Device", variant: "multiSelect", icon: Smartphone,
        dynamicOptions: { resourceType: "clickLogDevice", fetchFn: undefined } },
    }),
    columnHelper.accessor("deviceVendor", {
      id: "deviceVendor",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Device Vendor" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Device Vendor", label: "Device Vendor", icon: Cpu },
    }),
    columnHelper.accessor("deviceModel", {
      id: "deviceModel",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Device Model" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 140, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Device Model", label: "Device Model", icon: Workflow },
    }),
    columnHelper.accessor("geoState", {
      id: "geoState",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Geo State" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Geo State", label: "Geo State", variant: "multiSelect", icon: MapPin,
        dynamicOptions: { resourceType: "clickLogGeoState" as const, fetchFn: undefined } },
    }),
    columnHelper.accessor("geoCity", {
      id: "geoCity",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Geo City" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH, enableColumnFilter: true,
      meta: { headerTitle: "Geo City", label: "Geo City", variant: "multiSelect", icon: Building2,
        dynamicOptions: { resourceType: "clickLogGeoCity" as const, fetchFn: undefined } },
    }),
    columnHelper.accessor("referer", {
      id: "referer",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Referrer" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 200, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Referrer", label: "Referrer", icon: ExternalLink },
    }),
    columnHelper.accessor("utmSource", {
      id: "utmSource",
      header: ({ column }) => <DataGridColumnHeader column={column} title="UTM Source" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "UTM Source", label: "UTM Source", icon: Tags },
    }),
    columnHelper.accessor("utmMedium", {
      id: "utmMedium",
      header: ({ column }) => <DataGridColumnHeader column={column} title="UTM Medium" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "UTM Medium", label: "UTM Medium", icon: Tags },
    }),
    columnHelper.accessor("utmCampaign", {
      id: "utmCampaign",
      header: ({ column }) => <DataGridColumnHeader column={column} title="UTM Campaign" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 130, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "UTM Campaign", label: "UTM Campaign", icon: Tags },
    }),
    columnHelper.accessor("utmTerm", {
      id: "utmTerm",
      header: ({ column }) => <DataGridColumnHeader column={column} title="UTM Term" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "UTM Term", label: "UTM Term", icon: Tags },
    }),
    columnHelper.accessor("utmContent", {
      id: "utmContent",
      header: ({ column }) => <DataGridColumnHeader column={column} title="UTM Content" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 120, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "UTM Content", label: "UTM Content", icon: Tags },
    }),
    columnHelper.accessor("device", {
      id: "topDevice",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Device" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Device", label: "Device", icon: Smartphone },
    }),
    columnHelper.accessor("browser", {
      id: "topBrowser",
      header: ({ column }) => <DataGridColumnHeader column={column} title="Browser" pinnable />,
      cell: ({ getValue }) => (
        <div className="truncate text-[11px] text-muted-foreground">{getValue() || "—"}</div>
      ),
      size: 100, minSize: MIN_COLUMN_WIDTH,
      meta: { headerTitle: "Browser", label: "Browser", icon: Globe },
    }),

    // --- Filter-only hidden columns ---
    columnHelper.display({ id: "campaignId", size: 0, minSize: 0, enableColumnFilter: true,
      meta: { label: "Campaign", variant: "text", icon: Flag } }),
    columnHelper.display({ id: "funnelId", size: 0, minSize: 0, enableColumnFilter: true,
      meta: { label: "Funnel", variant: "text", icon: Layers } }),
    columnHelper.display({ id: "creativeId", size: 0, minSize: 0, enableColumnFilter: true,
      meta: { label: "Creative", variant: "text", icon: Image } }),
    columnHelper.display({ id: "tid", size: 0, minSize: 0, enableColumnFilter: true,
      meta: { label: "Tracking ID / Click ID", variant: "text", icon: Hash } }),
    columnHelper.display({ id: "landingPageId", size: 0, minSize: 0, enableColumnFilter: true,
      meta: { label: "Landing Page", variant: "text", icon: FileText } }),
  )

  return cols
}
