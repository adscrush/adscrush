"use client"

import type { ClickLogRow } from "../queries"
import { useMemo, useState } from "react"
import { useQueryStates } from "nuqs"
import { clickLogsSearchParams } from "../validations"
import { ClickLogsToolbar } from "./click-logs-toolbar"
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
} from "@tanstack/react-table"
import { type AnyColumnDef } from "@/types"
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridColumnHeader
} from "@adscrush/ui/components/reui/data-grid"
import { ScrollArea, ScrollBar } from "@adscrush/ui/components/scroll-area"
import { Badge } from "@adscrush/ui/components/badge"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import { format } from "date-fns"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import {
  Globe,
  Monitor,
  Link2,
  Hash,
  Package,
  Users,
  Building2,
  Calendar,
  Check,
  Radio,
} from "lucide-react"

/** Parameters passed to the click-logs query hook (admin and portal variants). */
export interface UseClickLogsQueryParams {
  filters: ExtendedColumnFilter<unknown>[]
  joinOperator: "and" | "or"
  page: number
  perPage: number
}

export type UseClickLogsQuery = (params: UseClickLogsQueryParams) => {
  data?: { data: unknown[]; pageCount: number; total: number }
  isLoading: boolean
}

interface ClickLogsTableProps {
  /** Query hook to use — allows admin and portal to pass different tRPC calls */
  useQueryHook: UseClickLogsQuery
  /** Column IDs to hide (e.g. "mediaBuyer", "advertiser") */
  hideColumns?: string[]
  /** Export handler injected by the parent page (admin vs portal). */
  onExport?: () => Promise<string>
  /** Filename prefix for the downloaded CSV. */
  exportFilename?: string
}

const columnHelper = createColumnHelper<ClickLogRow>()

function buildColumns(hideColumns: Set<string>): AnyColumnDef<ClickLogRow>[] {
  const allColumns: AnyColumnDef<ClickLogRow>[] = [
    columnHelper.accessor("tid", {
      id: "tid",
      size: 280,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="TID" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="font-mono text-[11px] font-semibold text-foreground/90">
            {value}
          </div>
        )
      },
      meta: {
        label: "TID",
        variant: "text",
        icon: Hash,
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("source", {
      id: "source",
      size: 120,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Source" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "Source",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("sourcePlatform", {
      id: "sourcePlatform",
      size: 120,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Platform" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium capitalize text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "Platform",
        variant: "multiSelect",
        icon: Radio,
        dynamicOptions: {
          resourceType: "clickLogPlatform",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("utmSource", {
      id: "utmSource",
      size: 110,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="UTM Source" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "UTM Source",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("utmMedium", {
      id: "utmMedium",
      size: 100,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="UTM Medium" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "UTM Medium",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("utmCampaign", {
      id: "utmCampaign",
      size: 130,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="UTM Campaign" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "UTM Campaign",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("utmTerm", {
      id: "utmTerm",
      size: 100,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="UTM Term" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "UTM Term",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("utmContent", {
      id: "utmContent",
      size: 100,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="UTM Content" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-medium text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "UTM Content",
        variant: "multiSelect",
        icon: Link2,
        dynamicOptions: {
          resourceType: "clickLogSource",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("ipAddress", {
      id: "ipAddress",
      size: 140,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="IP Address" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="font-mono text-[11px] text-foreground/90">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "IP Address",
        variant: "text",
        icon: Globe,
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("geoCountry", {
      id: "country",
      size: 100,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Country" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="text-[11px] font-semibold text-foreground">
            {value || <span className="text-muted-foreground/40">-</span>}
          </div>
        )
      },
      meta: {
        label: "Country",
        variant: "multiSelect",
        icon: Globe,
        dynamicOptions: {
          resourceType: "clickLogCountry",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("deviceType", {
      id: "deviceType",
      size: 140,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Device" />
      ),
      cell: ({ getValue, row }) => {
        const deviceType = getValue()
        const deviceVendor = row.original.deviceVendor
        const deviceModel = row.original.deviceModel

        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-foreground">
              {deviceType || <span className="text-muted-foreground/40">-</span>}
            </div>
            {(deviceVendor || deviceModel) && (
              <div className="text-[10px] text-muted-foreground/60 truncate max-w-[140px]">
                {deviceVendor && deviceModel ? `${deviceVendor} ${deviceModel}` : deviceVendor || deviceModel}
              </div>
            )}
          </div>
        )
      },
      meta: {
        label: "Device",
        variant: "multiSelect",
        icon: Monitor,
        dynamicOptions: {
          resourceType: "clickLogDevice",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("os", {
      id: "os",
      size: 120,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="OS" />
      ),
      cell: ({ getValue, row }) => {
        const os = getValue()
        const osVersion = row.original.osVersion

        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-foreground">
              {os || <span className="text-muted-foreground/40">-</span>}
            </div>
            {osVersion && (
              <div className="text-[10px] text-muted-foreground/60">
                v{osVersion}
              </div>
            )}
          </div>
        )
      },
      meta: {
        label: "OS",
        variant: "multiSelect",
        icon: Monitor,
        dynamicOptions: {
          resourceType: "clickLogOs",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("browser", {
      id: "browser",
      size: 120,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Browser" />
      ),
      cell: ({ getValue, row }) => {
        const browser = getValue()
        const browserVersion = row.original.browserVersion

        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] font-medium text-foreground">
              {browser || <span className="text-muted-foreground/40">-</span>}
            </div>
            {browserVersion && (
              <div className="text-[10px] text-muted-foreground/60">
                v{browserVersion}
              </div>
            )}
          </div>
        )
      },
      meta: {
        label: "Browser",
        variant: "multiSelect",
        icon: Monitor,
        dynamicOptions: {
          resourceType: "clickLogBrowser",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("productName", {
      id: "product",
      size: 200,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Product" />
      ),
      cell: ({ getValue, row }) => {
        const name = getValue()
        const id = row.original.productId
        return (
          <div className="flex flex-col">
            <span className="truncate text-[11px] leading-tight font-medium text-primary">
              {name || id}
            </span>
            <span className="truncate text-[10px] leading-tight text-muted-foreground">
              {id}
            </span>
          </div>
        )
      },
      meta: {
        label: "Product",
        variant: "multiSelect",
        icon: Package,
        dynamicOptions: {
          resourceType: "products",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("mediaBuyerName", {
      id: "mediaBuyer",
      size: 180,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Media Buyer" />
      ),
      cell: ({ getValue, row }) => {
        const name = getValue()
        const id = row.original.mediaBuyerId
        if (!name && !id) return <span className="text-muted-foreground opacity-50">-</span>

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
      },
      meta: {
        label: "Media Buyer",
        variant: "multiSelect",
        icon: Users,
        dynamicOptions: {
          resourceType: "mediaBuyers",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("advertiserName", {
      id: "advertiser",
      size: 180,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Advertiser" />
      ),
      cell: ({ getValue, row }) => {
        const name = getValue()
        const id = row.original.advertiserId
        return (
          <div className="flex flex-col">
            <span className="truncate text-[11px] leading-tight font-medium text-primary">
              {name || id}
            </span>
          </div>
        )
      },
      meta: {
        label: "Advertiser",
        variant: "multiSelect",
        icon: Building2,
        dynamicOptions: {
          resourceType: "advertisers",
          fetchFn: undefined,
        },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("isUnique", {
      id: "isUnique",
      size: 90,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Unique" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <Badge
            variant={value ? "default" : "outline"}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {value ? "Yes" : "No"}
          </Badge>
        )
      },
      meta: {
        label: "Unique",
        variant: "boolean",
        icon: Check,
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      size: 160,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Date" />
      ),
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground opacity-50">-</span>
        return (
          <div className="flex flex-col">
            <span className="text-[11px] font-medium">
              {format(new Date(value), "dd MMM yyyy")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(value), "HH:mm:ss")}
            </span>
          </div>
        )
      },
      meta: {
        label: "Date",
        variant: "date",
        icon: Calendar,
      },
      enableColumnFilter: true,
    }),
  ]

  return hideColumns.size > 0
    ? allColumns.filter((col) => col.id && !hideColumns.has(col.id))
    : allColumns
}

const DEFAULT_COLUMNS = buildColumns(new Set())

export function ClickLogsTable({ useQueryHook, hideColumns, onExport, exportFilename }: ClickLogsTableProps) {
  const [queryStates, setQueryStates] = useQueryStates(clickLogsSearchParams, {
    shallow: false,
  })

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["tid"],
  })

  const columns = useMemo(
    () => hideColumns ? buildColumns(new Set(hideColumns)) : DEFAULT_COLUMNS,
    [hideColumns],
  )

  const { data, isLoading } = useQueryHook({
    filters: queryStates.filters,
    joinOperator: queryStates.joinOperator,
    page: queryStates.page,
    perPage: queryStates.perPage,
  })

  const tableData = useMemo(() => (data?.data ?? []) as ClickLogRow[], [data?.data])
  const totalPages = useMemo(() => data?.pageCount ?? 0, [data?.pageCount])

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnOrder,
      columnPinning,
      pagination: {
        pageIndex: queryStates.page - 1,
        pageSize: queryStates.perPage,
      },
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({
          pageIndex: queryStates.page - 1,
          pageSize: queryStates.perPage,
        })
        setQueryStates({
          page: newPagination.pageIndex + 1,
          perPage: newPagination.pageSize,
        })
      }
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  })

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <DataTableFilterMenu
          table={table}
          shallow={false}
          debounceMs={300}
          throttleMs={50}
        />
        {onExport && (
          <ClickLogsToolbar onExport={onExport} filename={exportFilename} />
        )}
      </div>

      <DataGrid
        table={table}
        recordCount={data?.total ?? 0}
        isLoading={isLoading}
        tableLayout={{
          dense: true,
          rowBorder: true,
          stripped: true,
          headerBorder: true,
          headerSticky: true,
          width: "fixed",
          columnsResizable: true,
          columnsPinnable: true,
          columnsVisibility: true,
          columnsResizeMode: "onChange",
        }}
      >
        <div className=" gap-3">
          <DataGridContainer border={false} className=" border border-muted/50">
            <ScrollArea className="h-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>

        </div>
      </DataGrid>
    </div>
  )
}
