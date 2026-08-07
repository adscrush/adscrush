"use client"

import { Button } from "@adscrush/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@adscrush/ui/components/select"
import { Download } from "lucide-react"
import { useQueryStates } from "nuqs"
import { toast } from "@adscrush/ui/sonner"
import { useHasPermission } from "@/hooks/use-permission"
import { conversionLogsSearchParams } from "../validations"
import { useState } from "react"

interface ConversionLogsToolbarProps {
  /**
   * Export handler injected by the parent page (admin vs portal).
   * This ensures the correct tRPC endpoint is called depending on context.
   */
  onExport?: () => Promise<string>
  /** Filename prefix for the downloaded CSV (e.g. "conversion-logs"). */
  filename?: string
}

export function ConversionLogsToolbar({ onExport, filename = "conversion-logs" }: ConversionLogsToolbarProps) {
  // Hooks must be called unconditionally at the top of the component.
  const [filters, setFilters] = useQueryStates(conversionLogsSearchParams, {
    shallow: false,
  })
  const canExport = useHasPermission("report.export")
  const [isExporting, setIsExporting] = useState(false)

  if (!onExport) return null

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await onExport()
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to export conversion logs. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={filters.perPage.toString()}
        onValueChange={(v) => setFilters({ perPage: Number.parseInt(v), page: 1 })}
      >
        <SelectTrigger className="h-8 w-[60px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
          <SelectItem value="250">250</SelectItem>
          <SelectItem value="500">500</SelectItem>
        </SelectContent>
      </Select>

      {canExport && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 font-normal text-xs"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className={isExporting ? "size-3.5 animate-pulse" : "size-3.5"} />
          <span className="uppercase tracking-wider text-[10px] font-bold">
            {isExporting ? "Exporting…" : "Export CSV"}
          </span>
        </Button>
      )}
    </div>
  )
}
