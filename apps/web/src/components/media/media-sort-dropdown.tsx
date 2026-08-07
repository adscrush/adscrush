"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { ArrowDownUp, ArrowDown, ArrowUp } from "lucide-react"
import type { SortField, SortOrder } from "./media-grid"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaSortDropdownProps {
  sortBy: SortField
  sortOrder: SortOrder
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "dateUploaded", label: "Date uploaded" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "fileType", label: "File type" },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaSortDropdown({
  sortBy,
  sortOrder,
  onSortChange,
}: MediaSortDropdownProps) {
  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ?? "Date uploaded"

  function handleOptionClick(field: SortField) {
    if (field === sortBy) {
      // Toggle direction if same field is clicked
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New field defaults to desc
      onSortChange(field, "desc")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Sort by"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{currentLabel}</span>
          {sortOrder === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleOptionClick(option.value)}
            className="flex items-center justify-between"
          >
            <span>{option.label}</span>
            {sortBy === option.value && (
              <span className="text-muted-foreground">
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
