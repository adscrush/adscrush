"use client"

import { useConversionLogs, type ConversionLogRow } from "../queries"
import { useMemo, useState } from "react"
import { useQueryStates } from "nuqs"
import { conversionLogsSearchParams } from "../validations"
import { Badge } from "@adscrush/ui/components/badge"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import { format } from "date-fns"
import { formatCurrency } from "@/features/dashboard/utils"
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
  DataGridPagination,
  DataGridColumnHeader
} from "@adscrush/ui/components/reui/data-grid"
import { ScrollArea, ScrollBar } from "@adscrush/ui/components/scroll-area"
import { ConversionLogsToolbar } from "./conversion-logs-toolbar"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import {
  Package,
  Users,
  Building2,
  Globe,
  Hash,
  DollarSign,
  Check,
  Calendar,
  Receipt,
  CircleDollarSign,
  Flag,
  MousePointerClick,
  Radio,
  Link2,
  ExternalLink,
  Clock,
} from "lucide-react"

interface ConversionLogsTableProps {
  /** Export handler injected by the parent page (admin vs portal). */
  onExport?: () => Promise<string>
  /** Filename prefix for the downloaded CSV. */
  exportFilename?: string
}

const columnHelper = createColumnHelper<ConversionLogRow>()

const columns: AnyColumnDef<ConversionLogRow>[] = [
  columnHelper.accessor("id", {
    id: "id",
    size: 280,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="ID" />
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
      label: "ID",
      variant: "text",
      icon: Hash,
    },
  }),
  columnHelper.accessor("event", {
    id: "event",
    size: 130,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Event" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold uppercase tracking-wider"
        >
          {value || "-"}
        </Badge>
      )
    },
    meta: {
      label: "Event",
      variant: "multiSelect",
      icon: Receipt,
      dynamicOptions: {
        resourceType: "conversionLogEvent",
        fetchFn: undefined,
      },
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("status", {
    id: "status",
    size: 110,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      const variant = value === "approved" ? "default" : value === "pending" ? "secondary" : value === "rejected" ? "destructive" : "outline"
      return (
        <Badge
          variant={variant}
          className="text-[10px] font-bold uppercase tracking-wider"
        >
          {value}
        </Badge>
      )
    },
    meta: {
      label: "Status",
      variant: "multiSelect",
      icon: Check,
      dynamicOptions: {
        resourceType: "conversionLogStatus",
        fetchFn: undefined,
      },
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("revenue", {
    id: "revenue",
    size: 120,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Revenue" className="justify-end" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === null || value === undefined) return <span className="text-muted-foreground/40">-</span>
      return (
        <div className="text-right font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(Number(value))}
        </div>
      )
    },
    meta: {
      label: "Revenue",
      variant: "number",
      icon: DollarSign,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("payout", {
    id: "payout",
    size: 120,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Payout" className="justify-end" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === null || value === undefined) return <span className="text-muted-foreground/40">-</span>
      return (
        <div className="text-right font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
          {formatCurrency(Number(value))}
        </div>
      )
    },
    meta: {
      label: "Payout",
      variant: "number",
      icon: CircleDollarSign,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("method", {
    id: "method",
    size: 100,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Method" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      const variant = value === "pixel" ? "default" : value === "s2s" ? "secondary" : value === "postback" ? "outline" : "outline"
      const label = value === "s2s" ? "S2S" : value === "postback" ? "Postback" : value?.charAt(0).toUpperCase() + value?.slice(1) || "-"
      return (
        <Badge
          variant={variant}
          className="text-[10px] font-bold uppercase tracking-wider"
        >
          {label}
        </Badge>
      )
    },
    meta: {
      label: "Method",
      variant: "multiSelect",
      icon: Radio,
      dynamicOptions: {
        resourceType: "conversionLogMethod",
        fetchFn: undefined,
      },
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("postbackUrl", {
    id: "postbackUrl",
    size: 300,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Postback URL" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      if (!value) return <span className="text-muted-foreground/40">-</span>
      return (
        <div className="flex items-center gap-1.5">
          <ExternalLink className="size-3 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-mono text-[10px] text-foreground/80" title={value}>
            {value}
          </span>
        </div>
      )
    },
    meta: {
      label: "Postback URL",
      variant: "text",
      icon: Link2,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("referrerUrl", {
    id: "referrerUrl",
    size: 220,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Postback Data" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      if (!value) return <span className="text-muted-foreground/40">-</span>
      try {
        const domain = new URL(value).hostname
        return (
          <div className="flex items-center gap-1.5">
            <Globe className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate text-[11px] font-medium text-foreground/90" title={value}>
              {domain}
            </span>
          </div>
        )
      } catch {
        return (
          <span className="truncate text-[11px] text-foreground/70" title={value}>
            {value}
          </span>
        )
      }
    },
    meta: {
      label: "Postback Data",
      variant: "text",
      icon: ExternalLink,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("clickTime", {
    id: "clickTime",
    size: 160,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Click Time" />
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
      label: "Click Time",
      variant: "date",
      icon: Clock,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("currency", {
    id: "currency",
    size: 80,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Currency" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <div className="text-[11px] font-semibold text-foreground uppercase">
          {value || <span className="text-muted-foreground/40">-</span>}
        </div>
      )
    },
    meta: {
      label: "Currency",
      variant: "multiSelect",
      icon: DollarSign,
      dynamicOptions: {
        resourceType: "conversionLogCurrency",
        fetchFn: undefined,
      },
    },
    enableColumnFilter: true,
  }),    columnHelper.accessor("tid", {
      id: "tid",
    size: 280,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Click ID / TID" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <div className="font-mono text-[11px] text-foreground/80">
          {value || <span className="text-muted-foreground/40">-</span>}
        </div>
      )
    },
    meta: {
      label: "Click ID / TID",
      variant: "text",
      icon: MousePointerClick,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("productName", {
    id: "productId",
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
    id: "mediaBuyerId",
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
    id: "advertiserId",
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
  columnHelper.accessor("country", {
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
        resourceType: "conversionLogCountry",
        fetchFn: undefined,
      },
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("ip", {
    id: "ip",
    size: 140,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Conversion IP" />
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
      label: "Conversion IP",
      variant: "text",
      icon: Globe,
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
  columnHelper.accessor("campaignId", {
    id: "campaignId",
    size: 280,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Campaign" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <div className="font-mono text-[11px] text-foreground/80">
          {value || <span className="text-muted-foreground/40">-</span>}
        </div>
      )
    },
    meta: {
      label: "Campaign",
      variant: "text",
      icon: Flag,
    },
    enableColumnFilter: true,
  }),
  columnHelper.accessor("adAccountId", {
    id: "adAccountId",
    size: 280,
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Ad Account" />
    ),
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <div className="font-mono text-[11px] text-foreground/80">
          {value || <span className="text-muted-foreground/40">-</span>}
        </div>
      )
    },
    meta: {
      label: "Ad Account",
      variant: "text",
      icon: Hash,
    },
    enableColumnFilter: true,
  }),
]

export function ConversionLogsTable({ onExport, exportFilename }: ConversionLogsTableProps) {
  const [params, setParams] = useQueryStates(conversionLogsSearchParams, {
    shallow: false,
  })

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["tid", "event"],
  })

  const { data, isLoading } = useConversionLogs({
    filters: params.filters,
    joinOperator: params.joinOperator,
    page: params.page,
    perPage: params.perPage,
  })

  const tableData = useMemo(() => data?.data ?? [], [data?.data])
  const totalPages = useMemo(() => data?.pageCount ?? 0, [data?.pageCount])

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnOrder,
      columnPinning,
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.perPage,
      },
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({ pageIndex: params.page - 1, pageSize: params.perPage })
        setParams({
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
    defaultColumn: {
      size: 150,
    },
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
          <ConversionLogsToolbar onExport={onExport} filename={exportFilename} />
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
        <div className="flex flex-col gap-3">
          <DataGridContainer border={false} className="border border-muted/50">
            <ScrollArea className="h-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>

          <div className="flex items-center justify-end">
            <DataGridPagination />
          </div>
        </div>
      </DataGrid>
    </div>
  )
}
