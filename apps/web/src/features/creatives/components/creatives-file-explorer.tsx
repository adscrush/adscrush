"use client"

import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Search,
  Trash2,
  X,
} from "lucide-react"
import * as React from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

import type { Creative } from "../queries"
import { useCreatives } from "../queries"
import type { GetCreativesSchema } from "../validations"
import { UploadCreativeDialog } from "./upload-creative-dialog"
import { PreviewCreativeDialog } from "./preview-creative-dialog"
import { DeleteCreativesDialog } from "./delete-creatives-dialog"
import { ProductSelect } from "@/components/product-select"
import { formatFileSize } from "@/components/media/media-utils"

interface CreativesFileExplorerProps {
  search: GetCreativesSchema
}

export function CreativesFileExplorer({ search }: CreativesFileExplorerProps) {
  const [states, setStates] = useQueryStates({
    page: parseAsInteger.withDefault(search.page),
    perPage: parseAsInteger.withDefault(search.perPage),
    productId: parseAsString.withDefault(search.productId ?? ""),
  })

  const params = {
    ...search,
    page: states.page,
    perPage: states.perPage,
    productId: states.productId,
  }

  const { data, isLoading } = useCreatives(params)
  const items = React.useMemo(() => data?.data ?? [], [data?.data])
  const pageCount = data?.pageCount ?? 0
  const total = data?.meta?.total ?? 0

  const [searchValue, setSearchValue] = React.useState(search.search)
  const [filterType, setFilterType] = React.useState(search.fileType)
  const [filterStatus, setFilterStatus] = React.useState(
    search.status?.length ? search.status[0] ?? "" : ""
  )
  const [debouncedSearch] = useDebouncedValue(searchValue, { wait: 300 })

  React.useEffect(() => {
    setStates({
      page: 1,
    })
  }, [debouncedSearch, filterType, filterStatus, states.productId, setStates])

  const [previewCreative, setPreviewCreative] = React.useState<Creative | null>(null)
  const [deleteCreative, setDeleteCreative] = React.useState<Creative | null>(null)

  const handleClearFilters = () => {
    setSearchValue("")
    setFilterType("")
    setFilterStatus("")
    setStates({ productId: "" })
  }

  const hasFilters = searchValue || filterType || filterStatus || states.productId

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (debouncedSearch && !item.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
      if (filterType && item.fileType !== filterType) return false
      if (filterStatus && item.status !== filterStatus) return false
      return true
    })
  }, [items, debouncedSearch, filterType, filterStatus])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search creatives..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9 pl-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-[200px]">
          <ProductSelect
            value={states.productId || null}
            onChange={(v) => setStates({ productId: v as string || "" })}
            placeholder="All products"
          />
        </div>

        <UploadCreativeDialog />

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-9" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border bg-card p-3"
            >
              <div className="size-16 animate-pulse rounded bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No creatives found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your filters or search query."
              : "Upload your first creative to get started."}
          </p>
          {!hasFilters && (
            <div className="mt-4">
              <UploadCreativeDialog />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map((creative) => (
            <CreativeListItem
              key={creative.id}
              creative={creative}
              onPreview={setPreviewCreative}
              onDelete={setDeleteCreative}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="text-sm text-muted-foreground">
            {total} creative{total !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium whitespace-nowrap">
              Page {states.page} of {pageCount}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setStates({ page: 1 })}
                disabled={states.page <= 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setStates({ page: states.page - 1 })}
                disabled={states.page <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setStates({ page: states.page + 1 })}
                disabled={states.page >= pageCount}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setStates({ page: pageCount })}
                disabled={states.page >= pageCount}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <PreviewCreativeDialog
        open={previewCreative !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewCreative(null)
        }}
        creative={previewCreative}
      />

      <DeleteCreativesDialog
        open={deleteCreative !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCreative(null)
        }}
        creatives={deleteCreative ? [deleteCreative] : []}
        showTrigger={false}
      />
    </div>
  )
}

// ─── List Item Component ─────────────────────────────────────────────────────

interface CreativeListItemProps {
  creative: Creative
  onPreview: (creative: Creative) => void
  onDelete: (creative: Creative) => void
}

function CreativeListItem({ creative, onPreview, onDelete }: CreativeListItemProps) {
  const isImage = creative.mimeType?.startsWith("image/")
  const isVideo = creative.mimeType?.startsWith("video/")

  return (
    <div className="group flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50">
      {/* Thumbnail */}
      <button
        type="button"
        className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
        onClick={() => onPreview(creative)}
      >
        {isImage && creative.cdnUrl ? (
          <img
            src={creative.thumbnailUrl ?? creative.cdnUrl}
            alt={creative.altText ?? creative.name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : isVideo && creative.thumbnailUrl ? (
          <div className="relative size-full">
            <img
              src={creative.thumbnailUrl}
              alt={creative.altText ?? creative.name}
              className="size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/30">
              <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {creative.fileType === "image" ? (
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            ) : creative.fileType === "video" ? (
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            )}
          </div>
        )}
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{creative.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(creative.fileSize)}</span>
          {creative.mimeType && (
            <>
              <span>·</span>
              <span>{creative.mimeType.split('/').pop()?.toUpperCase()}</span>
            </>
          )}
          {creative.width && creative.height && (
            <>
              <span>·</span>
              <span>{creative.width}×{creative.height}</span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {creative.status === "active" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
            <span className="size-1.5 rounded-full bg-green-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
            <span className="size-1.5 rounded-full bg-gray-500" />
            Inactive
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onPreview(creative)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(creative)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
