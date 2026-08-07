"use client"

import { useMemo, useState } from "react"
import { useQueryStates } from "nuqs"
import { Badge } from "@adscrush/ui/components/badge"
import { endOfDay, format, startOfDay } from "date-fns"
import { CalendarDatePicker } from "@adscrush/ui/components/calendar-date-picker"
import { formatCurrency } from "@/features/dashboard/utils"
import { parseLeadDate, resolveLeadDateRange } from "@/features/portal/utils/lead-date-range"
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
  DataGridColumnHeader,
} from "@adscrush/ui/components/reui/data-grid"
import { ScrollArea, ScrollBar } from "@adscrush/ui/components/scroll-area"
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu"
import {
  Package,
  Globe,
  Hash,
  DollarSign,
  Check,
  Calendar,
  MousePointerClick,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  Users,
  Building2,
} from "lucide-react"
import { getFiltersStateParser } from "@adscrush/shared/lib/parsers"
import { parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs"
import { Button } from "@adscrush/ui/components/button"
import { Avatar, AvatarFallback } from "@adscrush/ui/components/avatar"
import { getInitials } from "@adscrush/shared/lib/initials"
import type { ExtendedColumnFilter } from "@adscrush/shared/types/data-table"

/** Parameters passed to the leads query hook (admin and portal variants). */
export interface UseLeadsQueryParams {
  page: number
  perPage: number
  filters: ExtendedColumnFilter<unknown>[]
  joinOperator: "and" | "or"
  dateFrom?: string
  dateTo?: string
  sort: string
  sortDir: "asc" | "desc"
}

export type UseLeadsQuery = (params: UseLeadsQueryParams) => {
  data?: { items: LeadRow[]; pageCount: number; total: number }
  isLoading: boolean
}

interface EmpLeadsDataTableProps {
  /** Query hook to use — allows admin and portal to pass different tRPC calls */
  useQueryHook: UseLeadsQuery
  /** Column IDs to hide (e.g. "mediaBuyer", "advertiser") */
  hideColumns?: string[]
  /** Reveal sensitive fields (real IP, sub3-5, method, currency) — reserved for super_admin/admin */
  showSensitive?: boolean
  onExport?: () => Promise<string>
  exportFilename?: string
}

// Local search params for leads — mirrors the DataTableFilterMenu pattern.
// dateFrom/dateTo are optional URL params; when absent the table defaults to today.
const leadsSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  dateFrom: parseAsString,
  dateTo: parseAsString,
}

/** Truncate a UUID to first 8 chars */
function truncateId(value: string): string {
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}...`
}

const columnHelper = createColumnHelper<LeadRow>()

type LeadRow = {
  id: string
  tid: string
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  pincode: string | null
  city: string | null
  state: string | null
  sub1: string | null
  sub2: string | null
  sub3: string | null
  sub4: string | null
  sub5: string | null
  payout: string
  status: string
  currency: string
  campaignId: string | null
  geoCountry: string | null
  ipEncrypted: string | null
  ipAddress: string | null
  method: string
  createdAt: Date | null
  product: { id: string; name: string } | null
  campaign: { id: string; name: string } | null
  mediaBuyer: { id: string; name: string } | null
  advertiser: { id: string; name: string } | null
}

function buildColumns(hideColumns: Set<string>, showSensitive: boolean): AnyColumnDef<LeadRow>[] {
  const allColumns: AnyColumnDef<LeadRow>[] = [
    columnHelper.accessor("id", {
      id: "id",
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="UUID" />,
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="group relative">
            <span className="font-mono text-[11px] font-semibold text-foreground/90" title={value}>
              {truncateId(value)}
            </span>
            <button
              className="ml-1 inline-flex items-center opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => navigator.clipboard.writeText(value)}
              title="Copy full UUID"
            >
              <svg className="size-3 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )
      },
      meta: { label: "UUID", variant: "text", icon: Hash },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      size: 150,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground opacity-50">-</span>
        return (
          <div className="flex flex-col">
            <span className="text-[11px] font-medium">{format(new Date(value), "dd MMM yyyy")}</span>
            <span className="text-[10px] text-muted-foreground">{format(new Date(value), "HH:mm:ss")}</span>
          </div>
        )
      },
      meta: { label: "Date", variant: "date", icon: Calendar },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("product", {
      id: "productId",
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Offer" />,
      cell: ({ getValue }) => {
        const product = getValue()
        if (!product) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex flex-col">
            <span className="truncate text-[11px] leading-tight font-medium text-primary">{product.name}</span>
            <span className="truncate text-[10px] leading-tight text-muted-foreground">{product.id}</span>
          </div>
        )
      },
      meta: { label: "Offer", variant: "multiSelect", icon: Package, dynamicOptions: { resourceType: "products" } },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("campaign", {
      id: "campaignId",
      size: 160,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Campaign" />,
      cell: ({ getValue }) => {
        const campaign = getValue()
        if (!campaign) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex flex-col">
            <span className="truncate text-[11px] leading-tight font-medium">{campaign.name}</span>
            <span className="truncate text-[10px] leading-tight text-muted-foreground font-mono">{campaign.id}</span>
          </div>
        )
      },
      meta: { label: "Campaign", variant: "text", icon: Package },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("mediaBuyer", {
      id: "mediaBuyerId",
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Media Buyer" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-5 shrink-0">
              <AvatarFallback className="text-[0.5rem]">{getInitials(value.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-[11px] font-medium">{value.name}</span>
          </div>
        )
      },
      meta: {
        label: "Media Buyer",
        variant: "multiSelect",
        icon: Users,
        dynamicOptions: { resourceType: "mediaBuyers" },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("advertiser", {
      id: "advertiserId",
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Advertiser" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex flex-col">
            <span className="truncate text-[11px] leading-tight font-medium text-primary">{value.name}</span>
          </div>
        )
      },
      meta: {
        label: "Advertiser",
        variant: "multiSelect",
        icon: Building2,
        dynamicOptions: { resourceType: "advertisers" },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("name", {
      id: "name",
      size: 140,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex items-center gap-1.5">
            <User className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="text-[11px] text-foreground/80" title={value}>{value}</span>
          </div>
        )
      },
      meta: { label: "Name", variant: "text", icon: User },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      size: 140,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Phone" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex items-center gap-1.5">
            <Phone className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="font-mono text-[11px] text-foreground/80" title={value}>{value}</span>
          </div>
        )
      },
      meta: { label: "Phone", variant: "text", icon: Phone },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("email", {
      id: "email",
      size: 180,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Email" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex items-center gap-1.5">
            <Mail className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="text-[11px] text-foreground/80" title={value}>{value}</span>
          </div>
        )
      },
      meta: { label: "Email", variant: "text", icon: Mail },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("address", {
      id: "address",
      size: 200,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Address" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="text-[11px] text-foreground/80" title={value}>{value}</span>
          </div>
        )
      },
      meta: { label: "Address", variant: "text", icon: MapPin },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("city", {
      id: "city",
      size: 110,
      header: ({ column }) => <DataGridColumnHeader column={column} title="City" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return <span className="text-[11px] text-foreground/80">{value}</span>
      },
      meta: { label: "City", variant: "text", icon: MapPin },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("state", {
      id: "state",
      size: 110,
      header: ({ column }) => <DataGridColumnHeader column={column} title="State" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return <span className="text-[11px] text-foreground/80">{value}</span>
      },
      meta: { label: "State", variant: "text", icon: MapPin },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("pincode", {
      id: "pincode",
      size: 100,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Pincode" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
      },
      meta: { label: "Pincode", variant: "text", icon: Hash },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("sub1", {
      id: "sub1",
      size: 120,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Sub1" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
      },
      meta: { label: "Sub1", variant: "text", icon: Hash },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("sub2", {
      id: "sub2",
      size: 120,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Sub2" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
      },
      meta: { label: "Sub2", variant: "text", icon: Hash },
      enableColumnFilter: true,
    }),
    // Sensitive sub fields — only rendered for super_admin/admin (showSensitive)
    ...(showSensitive
      ? [
          columnHelper.accessor("sub3", {
            id: "sub3",
            size: 120,
            header: ({ column }) => <DataGridColumnHeader column={column} title="Sub3" />,
            cell: ({ getValue }) => {
              const value = getValue()
              if (!value) return <span className="text-muted-foreground/40">-</span>
              return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
            },
            meta: { label: "Sub3", variant: "text", icon: Hash },
            enableColumnFilter: true,
          }),
          columnHelper.accessor("sub4", {
            id: "sub4",
            size: 120,
            header: ({ column }) => <DataGridColumnHeader column={column} title="Sub4" />,
            cell: ({ getValue }) => {
              const value = getValue()
              if (!value) return <span className="text-muted-foreground/40">-</span>
              return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
            },
            meta: { label: "Sub4", variant: "text", icon: Hash },
            enableColumnFilter: true,
          }),
          columnHelper.accessor("sub5", {
            id: "sub5",
            size: 120,
            header: ({ column }) => <DataGridColumnHeader column={column} title="Sub5" />,
            cell: ({ getValue }) => {
              const value = getValue()
              if (!value) return <span className="text-muted-foreground/40">-</span>
              return <span className="font-mono text-[11px] text-foreground/80">{value}</span>
            },
            meta: { label: "Sub5", variant: "text", icon: Hash },
            enableColumnFilter: true,
          }),
        ]
      : []),
    columnHelper.accessor("status", {
      id: "status",
      size: 110,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
      cell: ({ getValue }) => {
        const value = getValue()
        const variant = value === "approved" ? "default" : value === "pending" ? "secondary" : value === "rejected" ? "destructive" : "outline"
        return (
          <Badge variant={variant} className="text-[10px] font-bold uppercase tracking-wider">
            {value}
          </Badge>
        )
      },
      meta: {
        label: "Status",
        variant: "multiSelect",
        icon: Check,
        options: [
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("payout", {
      id: "payout",
      size: 100,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Payout" className="justify-end" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (value === null || value === undefined) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="text-right font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(Number(value))}
          </div>
        )
      },
      meta: { label: "Payout", variant: "number", icon: DollarSign },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("geoCountry", {
      id: "geoCountry",
      size: 90,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Geo" />,
      cell: ({ getValue }) => {
        const value = getValue()
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="flex items-center gap-1.5">
            <Globe className="size-3 shrink-0 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold text-foreground">{value}</span>
          </div>
        )
      },
      meta: {
        label: "Geo",
        variant: "multiSelect",
        icon: Globe,
        dynamicOptions: { resourceType: "conversionLogCountry" },
      },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("ipEncrypted", {
      id: "ip",
      size: 130,
      header: ({ column }) => <DataGridColumnHeader column={column} title="IP" />,
      cell: ({ getValue, row }) => {
        const value = getValue()
        // Admin/super_admin gets the real (decrypted) IP from the server
        if (showSensitive) {
          const ip = row.original.ipAddress
          if (ip) {
            return <div className="font-mono text-[11px] text-foreground/70">{ip}</div>
          }
          return <span className="text-muted-foreground/40">-</span>
        }
        if (!value) return <span className="text-muted-foreground/40">-</span>
        return (
          <div className="font-mono text-[11px] text-foreground/70" title="IP address (masked)">
            ***.***.***.***
          </div>
        )
      },
      meta: { label: "IP", variant: "text", icon: Globe },
      enableColumnFilter: true,
    }),
    columnHelper.accessor("tid", {
      id: "tid",
      size: 260,
      header: ({ column }) => <DataGridColumnHeader column={column} title="Click ID" />,
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div
            className="break-all font-mono text-[10px] leading-relaxed text-foreground/70"
            title={value}
          >
            {value}
          </div>
        )
      },
      meta: { label: "Click ID", variant: "text", icon: MousePointerClick },
      enableColumnFilter: true,
    }),
    // Additional source/detail fields — admin-only
    ...(showSensitive
      ? [
          columnHelper.accessor("method", {
            id: "method",
            size: 100,
            header: ({ column }) => <DataGridColumnHeader column={column} title="Method" />,
            cell: ({ getValue }) => {
              const value = getValue()
              if (!value) return <span className="text-muted-foreground/40">-</span>
              return (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {value}
                </span>
              )
            },
            meta: { label: "Method", variant: "text", icon: MousePointerClick },
            enableColumnFilter: true,
          }),
          columnHelper.accessor("currency", {
            id: "currency",
            size: 80,
            header: ({ column }) => <DataGridColumnHeader column={column} title="Currency" />,
            cell: ({ getValue }) => {
              const value = getValue()
              if (!value) return <span className="text-muted-foreground/40">-</span>
              return <span className="font-mono text-[11px] font-semibold text-foreground/80">{value}</span>
            },
            meta: { label: "Currency", variant: "text", icon: DollarSign },
            enableColumnFilter: true,
          }),
        ]
      : []),
  ]

  return hideColumns.size > 0
    ? allColumns.filter((col) => col.id && !hideColumns.has(col.id))
    : allColumns
}

export function EmpLeadsDataTable({ useQueryHook, hideColumns, showSensitive = false, onExport, exportFilename }: EmpLeadsDataTableProps) {
  const [params, setParams] = useQueryStates(leadsSearchParams, { shallow: false })
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["id", "status", "name", "phone"],
  })

  const columns = useMemo(
    () => buildColumns(new Set(hideColumns ?? []), showSensitive),
    [hideColumns, showSensitive],
  )

  // Pass filters and joinOperator to the backend query — date range defaults to today.
  const { dateFrom, dateTo } = resolveLeadDateRange(params)
  const { data, isLoading } = useQueryHook({
    page: params.page,
    perPage: params.perPage,
    filters: params.filters,
    joinOperator: params.joinOperator,
    dateFrom,
    dateTo,
    sort: "createdAt",
    sortDir: "desc",
  })

  const tableData = useMemo(() => data?.items ?? [], [data?.items])
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
    defaultColumn: { size: 150 },
  })

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDatePicker
            key={`${params.dateFrom}-${params.dateTo}`}
            date={{
              from: params.dateFrom ? parseLeadDate(params.dateFrom) : startOfDay(new Date()),
              to: params.dateTo ? parseLeadDate(params.dateTo) : endOfDay(new Date()),
            }}
            onDateSelect={(d) => {
              setParams({
                page: 1,
                dateFrom: d.from ? format(d.from, "yyyy-MM-dd") : null,
                dateTo: d.to ? format(d.to, "yyyy-MM-dd") : null,
              })
            }}
            className="w-fit max-w-[220px] px-5 text-xs"
            variant="outline"
          />
          <DataTableFilterMenu
            table={table}
            shallow={false}
            debounceMs={300}
            throttleMs={50}
          />
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const csv = await onExport()
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `${exportFilename || "leads"}-${format(new Date(), "yyyy-MM-dd")}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="mr-1.5 size-3.5" />
              Export CSV
            </Button>
          )}
        </div>
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
