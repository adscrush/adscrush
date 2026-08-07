"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { PerformanceRow } from "../queries"
import { formatCurrency, formatCompactNumber } from "@/features/dashboard/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@adscrush/ui/components/tooltip"

export const detailedReportsColumns: ColumnDef<PerformanceRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col">
              <span className="truncate text-[11px] leading-tight font-medium text-primary">
                {row.original.name || row.original.id}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="border-border bg-background shadow-xl">
            <span className="text-[10px]">
              ID: {row.original.id}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    accessorKey: "clicks",
    header: () => <div className="text-right">Gross Clicks</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCompactNumber(row.original.clicks)}</div>
    ),
  },
  {
    accessorKey: "conversions",
    header: () => <div className="text-right">Conversions</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCompactNumber(row.original.conversions)}</div>
    ),
  },
  {
    accessorKey: "revenue",
    header: () => <div className="text-right">Advertiser Price</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCurrency(row.original.revenue)}</div>
    ),
  },
  {
    accessorKey: "payout",
    header: () => <div className="text-right whitespace-nowrap">Affiliate Payout</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCurrency(row.original.payout)}</div>
    ),
  },
  {
    id: "profit",
    header: () => <div className="text-right">Profit</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold text-primary">{formatCurrency(row.original.profit)}</div>
    ),
  },
  {
    id: "cr",
    header: () => <div className="text-right">CR</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold text-primary">{row.original.cr.toFixed(3)}%</div>
    ),
  },
  {
    id: "rpc",
    header: () => <div className="text-right">RPC</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCurrency(row.original.rpc)}</div>
    ),
  },
  {
    id: "epc",
    header: () => <div className="text-right">EPC</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono text-[11px] font-bold">{formatCurrency(row.original.epc)}</div>
    ),
  },
]
