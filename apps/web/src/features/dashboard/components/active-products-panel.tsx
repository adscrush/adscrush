"use client"

import { formatCurrency, formatCompactNumber } from "../utils"
import type { ActiveProductItem } from "../types"
import { Badge } from "@adscrush/ui/components/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@adscrush/ui/lib/utils"

interface ActiveProductsPanelProps {
  products: ActiveProductItem[]
}

export function ActiveProductsPanel({ products }: ActiveProductsPanelProps) {
  return (
    <div className="h-full">
      <div className="border-b px-6 py-4 bg-background">
        <h3 className="text-sm font-bold tracking-tight">Active Products</h3>
      </div>
      <div className="overflow-x-auto bg-background">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Revenue</th>
              <th className="px-6 py-3">Clicks</th>
              <th className="px-6 py-3">Conversions</th>
              <th className="px-6 py-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dashed border-muted-foreground/50">EPC</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-48 text-xs">Earnings per click — total payout divided by total clicks</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-6 py-3">Last Conv.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">{product.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-none", product.status === "active" ? "bg-emerald-500" : "bg-muted-foreground")} />
                      <Badge variant={product.status === "active" ? "outline" : "secondary"} className="rounded-none font-bold text-[10px] uppercase tracking-wide border-0 bg-muted/50">
                        {product.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-4 font-medium">{formatCompactNumber(product.clicks)}</td>
                  <td className="px-6 py-4 font-medium">{formatCompactNumber(product.conversions)}</td>
                  <td className="px-6 py-4 font-mono text-xs font-semibold tabular-nums">
                    {product.clicks > 0 ? formatCurrency(product.payout / product.clicks, "USD", 2) : "-"}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {product.lastConversion ? formatDistanceToNow(new Date(product.lastConversion), { addSuffix: true }) : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                  No active products found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
