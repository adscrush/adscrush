"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useQueryState } from "nuqs"
import { Button } from "@adscrush/ui/components/button"
import { ToggleGroup, ToggleGroupItem } from "@adscrush/ui/components/toggle-group"
import { Separator } from "@adscrush/ui/components/separator"
import { Grid3X3, List, Upload, FolderPlus, X } from "lucide-react"
import { FolderTree } from "./folder-tree"
import { MediaGrid, type SortField, type SortOrder } from "./media-grid"
import type { MediaFilterValues } from "./media-filters"
import { MediaFilters } from "./media-filters"
import { MediaSortDropdown } from "./media-sort-dropdown"
import { MediaBreadcrumbs } from "./media-breadcrumbs"
import { UploadManager } from "./upload-manager"
import { UploadPopup } from "./upload-popup"
import { FileDetailsPanel } from "./file-details-panel"
import { ScrollArea } from "@adscrush/ui/components/scroll-area"
import { cn } from "@adscrush/ui/lib/utils"
import { useSession } from "@/lib/auth/client"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import { trpc } from "@/lib/trpc/client"
import type { MediaFile } from "@adscrush/db/schema"
import { useUploadQueue } from "./use-upload-queue"

interface MediaLibraryContentProps {
  uploadedBy?: string
}

export function MediaLibraryContent({ uploadedBy }: MediaLibraryContentProps) {
  const { data: session } = useSession()
  const user = session?.user
  const utils = trpc.useUtils()

  const [viewMode, setViewMode] = useQueryState("view", { defaultValue: "list" })
  const [filters, setFilters] = useState<MediaFilterValues>({})
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showUploadDropzone, setShowUploadDropzone] = useState(false)
  const [sortBy, setSortBy] = useState<SortField>("dateUploaded")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [showFolderTree, setShowFolderTree] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUpload =
    !!user &&
    (isAtLeastRole(user.role, ROLES.ADMIN) || Boolean(user.mediaBuyerId))

  const handleUploadComplete = useCallback(() => {
    void utils.media.list.invalidate()
  }, [utils])

  const {
    items: uploadItems,
    addFiles,
    retryUpload,
    dismissItem,
    clearCompleted,
  } = useUploadQueue(selectedFolderId, handleUploadComplete)

  const { data: folders } = trpc.mediaFolders.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const selectedFolderName = useMemo(() => {
    if (!selectedFolderId || !folders) return null
    const folder = folders.find((f) => f.id === selectedFolderId)
    return folder?.name ?? null
  }, [selectedFolderId, folders])

  function handleViewModeChange(value: string) {
    if (value === "grid" || value === "list") {
      setViewMode(value)
    }
  }

  const handleFilterChange = useCallback((newFilters: MediaFilterValues) => {
    setFilters(newFilters)
  }, [])

  const handleSortChange = useCallback((newSortBy: SortField, newSortOrder: SortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId)
    setSelectedFile(null)
  }, [])

  const handleUploadButtonClick = useCallback(() => {
    if (!showUploadDropzone) {
      // First click: show dropzone
      setShowUploadDropzone(true)
    } else {
      // Second click: open file picker
      fileInputRef.current?.click()
    }
  }, [showUploadDropzone])

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden bg-background">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {folders && (
            <MediaBreadcrumbs
              folderId={selectedFolderId}
              folders={folders}
              onNavigate={handleFolderSelect}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              !showFolderTree && "bg-accent text-foreground",
            )}
            onClick={() => setShowFolderTree((v) => !v)}
          >
            <FolderPlus className="size-3.5" />
            Folders
          </Button>

          <Separator orientation="vertical" className="h-8" />

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            className="border rounded-md h-8"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" className="size-8 p-0 flex items-center justify-center">
              <Grid3X3 className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="size-8 p-0 flex items-center justify-center">
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/quicktime,video/webm,application/pdf,font/woff,font/woff2,font/ttf,font/otf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    addFiles(e.target.files)
                    e.target.value = ""
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleUploadButtonClick}
                className="h-8 gap-1.5"
              >
                <Upload className="size-3.5" />
                Upload
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── Upload Dropzone ────────────────────────────────────────────── */}
      {canUpload && showUploadDropzone && (
        <div className="shrink-0 border-b bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Upload files</h3>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setShowUploadDropzone(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <UploadManager onAddFiles={addFiles} />
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-0">
        {/* Sidebar - Folder Tree */}
        {showFolderTree && (
          <aside className="w-60 shrink-0 border-r bg-muted/10">
            <ScrollArea className="h-full">
              <FolderTree
                selectedFolderId={selectedFolderId}
                onSelectFolder={handleFolderSelect}
              />
            </ScrollArea>
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Filter Toolbar */}
          <div className="shrink-0 border-b bg-background px-4 py-2.5">
            <MediaFilters onFilterChange={handleFilterChange}>
              <MediaSortDropdown
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </MediaFilters>
          </div>

          {/* Media Grid */}
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col min-h-0">
              <MediaGrid
                viewMode={viewMode as "grid" | "list"}
                folderId={selectedFolderId}
                folderName={selectedFolderName}
                search={filters.search}
                mimeCategory={filters.mimeCategory}
                tags={filters.tags}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onFileSelect={setSelectedFile}
                onFolderSelect={handleFolderSelect}
                onUploadClick={() => fileInputRef.current?.click()}
                onSortChange={handleSortChange}
                uploadedBy={uploadedBy}
              />
            </div>
            {selectedFile && (
              <FileDetailsPanel
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Upload Popup ────────────────────────────────────────────────── */}
      <UploadPopup
        items={uploadItems}
        onRetry={retryUpload}
        onDismiss={dismissItem}
        onClearCompleted={clearCompleted}
      />
    </div>
  )
}
