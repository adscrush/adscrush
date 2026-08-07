"use client"

import { useState, useCallback } from "react"
import { Input } from "@adscrush/ui/components/input"
import { Button } from "@adscrush/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { Badge } from "@adscrush/ui/components/badge"
import { Search, X } from "lucide-react"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"

// ─── Types ───────────────────────────────────────────────────────────────────

export type MimeCategory = "all" | "image" | "video" | "document" | "font"

export interface MediaFilterValues {
  search?: string
  mimeCategory?: "image" | "video" | "document" | "font"
  tags?: string[]
}

interface MediaFiltersProps {
  onFilterChange: (filters: MediaFilterValues) => void
  /** Initial filter values (useful for controlled usage) */
  initialValues?: Partial<MediaFilterValues>
  /** Whether to show the tag filter input */
  showTagFilter?: boolean
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** Additional content to render after the filters (e.g., view toggle, upload button) */
  children?: React.ReactNode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 300
const MAX_SEARCH_LENGTH = 200

// ─── Component ───────────────────────────────────────────────────────────────

export function MediaFilters({
  onFilterChange,
  initialValues,
  showTagFilter = true,
  searchPlaceholder = "Search files...",
  children,
}: MediaFiltersProps) {
  const [searchInput, setSearchInput] = useState(initialValues?.search ?? "")
  const [mimeCategory, setMimeCategory] = useState<MimeCategory>(
    initialValues?.mimeCategory ?? "all"
  )
  const [tagInput, setTagInput] = useState(
    initialValues?.tags?.join(", ") ?? ""
  )

  // Debounced search: emits filter change 300ms after user stops typing
  const debouncedEmitSearch = useDebouncedCallback(
    (query: string, mime: MimeCategory, tagStr: string) => {
      emitFilters(query, mime, tagStr)
    },
    DEBOUNCE_MS
  )

  // Emit current filter state to parent
  const emitFilters = useCallback(
    (query: string, mime: MimeCategory, tagStr: string) => {
      const filters: MediaFilterValues = {}

      const trimmedQuery = query.trim()
      if (trimmedQuery.length >= 1 && trimmedQuery.length <= MAX_SEARCH_LENGTH) {
        filters.search = trimmedQuery
      }

      if (mime !== "all") {
        filters.mimeCategory = mime
      }

      const tags = tagStr
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
      if (tags.length > 0) {
        filters.tags = tags
      }

      onFilterChange(filters)
    },
    [onFilterChange]
  )

  // Handle search input change with debounce
  function handleSearchChange(value: string) {
    // Enforce max length
    const clamped = value.slice(0, MAX_SEARCH_LENGTH)
    setSearchInput(clamped)
    debouncedEmitSearch(clamped, mimeCategory, tagInput)
  }

  // Handle MIME category change (immediate, no debounce needed)
  function handleMimeCategoryChange(value: string) {
    const newCategory = value as MimeCategory
    setMimeCategory(newCategory)
    emitFilters(searchInput, newCategory, tagInput)
  }

  // Handle tag input change with debounce
  function handleTagChange(value: string) {
    setTagInput(value)
    debouncedEmitSearch(searchInput, mimeCategory, value)
  }

  // Clear all filters
  function clearFilters() {
    setSearchInput("")
    setMimeCategory("all")
    setTagInput("")
    onFilterChange({})
  }

  const hasActiveFilters =
    searchInput.trim().length > 0 || mimeCategory !== "all" || tagInput.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8"
            maxLength={MAX_SEARCH_LENGTH}
            aria-label="Search media files"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("")
                emitFilters("", mimeCategory, tagInput)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* File Type Filter */}
        <Select value={mimeCategory} onValueChange={handleMimeCategoryChange}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by file type">
            <SelectValue placeholder="File type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="font">Fonts</SelectItem>
          </SelectContent>
        </Select>

        {/* Tag Filter */}
        {showTagFilter && (
          <Input
            placeholder="Filter by tags (comma-separated)..."
            value={tagInput}
            onChange={(e) => handleTagChange(e.target.value)}
            className="w-[200px]"
            aria-label="Filter by tags"
          />
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            title="Clear all filters"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Additional controls (view toggle, upload button, etc.) */}
        {children}
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {searchInput.trim() && (
            <Badge variant="secondary" className="text-xs">
              Search: &quot;{searchInput.trim()}&quot;
            </Badge>
          )}
          {mimeCategory !== "all" && (
            <Badge variant="secondary" className="text-xs capitalize">
              Type: {mimeCategory}s
            </Badge>
          )}
          {tagInput.trim() && (
            <Badge variant="secondary" className="text-xs">
              Tags:{" "}
              {tagInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .join(", ")}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
