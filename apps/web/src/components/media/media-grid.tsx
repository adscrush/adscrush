"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@adscrush/ui/lib/utils"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@adscrush/ui/components/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@adscrush/ui/components/dialog"
import { ScrollArea } from "@adscrush/ui/components/scroll-area"
import {
  IconLoader2,
  IconAlertTriangle,
  IconRefresh,
  IconTrash,
  IconEye,
  IconCopy,
  IconFolderSymlink,
  IconFolder,
  IconUpload,
  IconCheck,
  IconArrowNarrowUp,
  IconArrowNarrowDown,
  IconDownload,
  IconX,
  IconPhoto,
  IconPlayerPlayFilled,
} from "@tabler/icons-react"
import { getMimeIcon, getMimeCategory, formatFileSize } from "./media-utils"
import { useVideoPoster, useInView } from "./use-video-poster"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@adscrush/ui/components/context-menu"
import { toast } from "@adscrush/ui/sonner"
import { trpc } from "@/lib/trpc/client"
import { useSession } from "@/lib/auth/client"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { ROLES } from "@adscrush/shared/constants/roles"
import { type ALLOWED_MEDIA_MIME_TYPES } from "@adscrush/shared/validators/media.schema"
import type { MediaFile } from "@adscrush/db/schema"

export type SortField = "name" | "size" | "dateUploaded" | "fileType"
export type SortOrder = "asc" | "desc"

interface MediaGridProps {
  viewMode: "grid" | "list"
  folderId?: string | null
  folderName?: string | null
  search?: string
  mimeCategory?: "image" | "video" | "document" | "font"
  tags?: string[]
  sortBy?: SortField
  sortOrder?: SortOrder
  onFileSelect?: (file: MediaFile) => void
  onFolderSelect?: (folderId: string) => void
  onUploadClick?: () => void
  onSortChange?: (sortBy: SortField, sortOrder: SortOrder) => void
  uploadedBy?: string
}

const PAGE_SIZE = 50
const GRID_ROW_HEIGHT = 220
const GRID_ROW_GAP = 12
const LIST_ROW_HEIGHT = 60
const OVERSCAN = 2

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const SORT_COLUMNS: { key: SortField; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "fileType", label: "Type" },
  { key: "size", label: "File size" },
  { key: "dateUploaded", label: "Date" },
]

export function MediaGrid({
  viewMode,
  folderId,
  folderName,
  search,
  mimeCategory,
  tags,
  sortBy = "dateUploaded",
  sortOrder = "desc",
  onFileSelect,
  onFolderSelect,
  onUploadClick,
  onSortChange,
  uploadedBy,
}: MediaGridProps) {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = !!user && isAtLeastRole(user.role, ROLES.ADMIN)

  const parentRef = React.useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = React.useState(6)
  const previousFirstVisibleIndexRef = React.useRef<number>(0)

  const { data: subfolders } = trpc.mediaFolders.listChildren.useQuery(
    { parentId: folderId ?? null },
    {
      enabled: viewMode === "grid",
      refetchOnWindowFocus: false,
    },
  )

  const [selectedFileIds, setSelectedFileIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setSelectedFileIds(new Set())
  }, [viewMode, folderId, search, mimeCategory])

  const selectedCount = selectedFileIds.size

  const toggleFileSelection = React.useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }, [])

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [showMoveDialog, setShowMoveDialog] = React.useState(false)
  const [moveTargetFolderId, setMoveTargetFolderId] = React.useState<string | null>(null)
  const [isBulkActionPending, setIsBulkActionPending] = React.useState(false)

  const utils = trpc.useUtils()

  const { data: allFolders } = trpc.mediaFolders.list.useQuery(undefined, {
    enabled: showMoveDialog,
    refetchOnWindowFocus: false,
  })

  const deleteFilesMutation = trpc.media.deleteFiles.useMutation({
    onSuccess: (data) => {
      utils.media.list.invalidate()
      utils.mediaFolders.listChildren.invalidate()
      if (data.failed.length === 0) {
        toast.success(`${data.deleted.length} file${data.deleted.length !== 1 ? "s" : ""} deleted`)
        setSelectedFileIds(new Set())
      } else {
        toast.error(
          `${data.failed.length} file${data.failed.length !== 1 ? "s" : ""} failed to delete. ${data.deleted.length} deleted successfully.`,
        )
        const failedIds = new Set(data.failed.map((f) => f.id))
        setSelectedFileIds(failedIds)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete files")
    },
    onSettled: () => {
      setIsBulkActionPending(false)
    },
  })

  const moveFilesMutation = trpc.media.moveFiles.useMutation({
    onSuccess: (data) => {
      utils.media.list.invalidate()
      utils.mediaFolders.list.invalidate()
      utils.mediaFolders.listChildren.invalidate()
      if (data.failureCount === 0) {
        toast.success(`${data.successCount} file${data.successCount !== 1 ? "s" : ""} moved`)
        setSelectedFileIds(new Set())
      } else {
        toast.error(
          `${data.failureCount} file${data.failureCount !== 1 ? "s" : ""} failed to move. ${data.successCount} moved successfully.`,
        )
        const failedIds = new Set(
          data.results.filter((r) => !r.success).map((r) => r.fileId),
        )
        setSelectedFileIds(failedIds)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to move files")
    },
    onSettled: () => {
      setIsBulkActionPending(false)
      setShowMoveDialog(false)
      setMoveTargetFolderId(null)
    },
  })

  const createFolderMutation = trpc.mediaFolders.create.useMutation({
    onSuccess: () => {
      utils.mediaFolders.list.invalidate()
      utils.mediaFolders.listChildren.invalidate()
      toast.success("Folder created")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create folder")
    },
  })

  const handleContextDelete = React.useCallback((fileId: string) => {
    setSelectedFileIds(new Set([fileId]))
    setShowDeleteConfirm(true)
  }, [])

  const handleContextMove = React.useCallback((fileId: string) => {
    setSelectedFileIds(new Set([fileId]))
    setShowMoveDialog(true)
  }, [])

  const handleContextCopyLink = React.useCallback((cdnUrl: string | null) => {
    if (!cdnUrl) return
    void navigator.clipboard.writeText(cdnUrl)
    toast.success("Link copied")
  }, [])

  const handleContextDownload = React.useCallback((cdnUrl: string | null) => {
    if (cdnUrl) window.open(cdnUrl, "_blank")
  }, [])

  const replaceMutation = trpc.media.replace.useMutation()
  const replaceFileInputRef = React.useRef<HTMLInputElement>(null)
  const replaceFileIdRef = React.useRef<string | null>(null)
  const [replaceItems, setReplaceItems] = React.useState<
    Array<{ fileId: string; fileName: string; progress: number; status: "uploading" | "success" | "error" }>
  >([])
  const replaceProgressRef = React.useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const handleContextNewFolder = React.useCallback(() => {
    const name = window.prompt("Folder name")
    if (name?.trim()) {
      createFolderMutation.mutate({ name: name.trim(), parentId: folderId ?? null })
    }
  }, [createFolderMutation, folderId])

  const handleBulkDelete = React.useCallback(() => {
    setIsBulkActionPending(true)
    deleteFilesMutation.mutate({ fileIds: Array.from(selectedFileIds) })
    setShowDeleteConfirm(false)
  }, [selectedFileIds, deleteFilesMutation])

  const handleBulkMove = React.useCallback(() => {
    setIsBulkActionPending(true)
    moveFilesMutation.mutate({
      fileIds: Array.from(selectedFileIds),
      targetFolderId: moveTargetFolderId,
    })
  }, [selectedFileIds, moveTargetFolderId, moveFilesMutation])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.media.list.useInfiniteQuery(
    {
      pageSize: PAGE_SIZE,
      folderId: folderId ?? undefined,
      search: search || undefined,
      mimeCategory,
      tags,
      sortBy,
      sortOrder,
      uploadedBy,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      refetchOnWindowFocus: false,
    },
  )

  const allItems = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.items)
  }, [data?.pages])

  const handleReplaceFile = React.useCallback(
    (fileId: string) => {
      const item = allItems.find((i) => i.id === fileId)
      const fileName = item?.name ?? "Unknown file"

      replaceFileIdRef.current = fileId

      setReplaceItems((prev) => [
        ...prev,
        { fileId, fileName, progress: 0, status: "uploading" as const },
      ])

      let progress = 0
      const interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90)
        setReplaceItems((prev) =>
          prev.map((r) =>
            r.fileId === fileId ? { ...r, progress: Math.round(progress) } : r,
          ),
        )
      }, 500)
      replaceProgressRef.current.set(fileId, interval)

      replaceFileInputRef.current?.click()
    },
    [allItems],
  )

  const onReplaceFileSelected = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileId = replaceFileIdRef.current
      const file = e.target.files?.[0]
      if (!fileId || !file) return

      replaceFileIdRef.current = null
      e.target.value = ""

      try {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(",")[1] ?? "")
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        await replaceMutation.mutateAsync({
          fileId,
          file: base64,
          fileName: file.name,
          mimeType: file.type as (typeof ALLOWED_MEDIA_MIME_TYPES)[number],
        })

        const interval = replaceProgressRef.current.get(fileId)
        if (interval) {
          clearInterval(interval)
          replaceProgressRef.current.delete(fileId)
        }

        setReplaceItems((prev) =>
          prev.map((r) =>
            r.fileId === fileId ? { ...r, progress: 100, status: "success" } : r,
          ),
        )

        setTimeout(() => {
          setReplaceItems((prev) => prev.filter((r) => r.fileId !== fileId))
        }, 4000)

        utils.media.list.invalidate()
        utils.mediaFolders.listChildren.invalidate()
      } catch {
        const interval = replaceProgressRef.current.get(fileId)
        if (interval) {
          clearInterval(interval)
          replaceProgressRef.current.delete(fileId)
        }

        setReplaceItems((prev) =>
          prev.map((r) =>
            r.fileId === fileId ? { ...r, progress: 0, status: "error" } : r,
          ),
        )

        setTimeout(() => {
          setReplaceItems((prev) => prev.filter((r) => r.fileId !== fileId))
        }, 6000)
      }
    },
    [replaceMutation, utils],
  )

  const dismissReplace = React.useCallback((fileId: string) => {
    const interval = replaceProgressRef.current.get(fileId)
    if (interval) {
      clearInterval(interval)
      replaceProgressRef.current.delete(fileId)
    }
    setReplaceItems((prev) => prev.filter((r) => r.fileId !== fileId))
  }, [])

  const activeReplacingFileId = replaceItems.find((r) => r.status === 'uploading')?.fileId

  const toggleSelectAll = React.useCallback(() => {
    setSelectedFileIds((prev) => {
      if (prev.size === allItems.length && allItems.length > 0) {
        return new Set()
      }
      return new Set(allItems.map((item) => item.id))
    })
  }, [allItems])

  const isAllSelected = allItems.length > 0 && selectedFileIds.size === allItems.length
  const isSomeSelected = selectedFileIds.size > 0 && selectedFileIds.size < allItems.length

  function getColumnCountFromWidth(width: number): number {
    if (width >= 1400) return 7
    if (width >= 1200) return 6
    if (width >= 900) return 5
    if (width >= 600) return 4
    if (width >= 400) return 3
    return 2
  }

  // Always observe container width so columnCount is correct when switching to grid.
  // Previously this only ran when viewMode === "grid", causing a stale initial render.
  React.useLayoutEffect(() => {
    if (!parentRef.current) return
    setColumnCount(getColumnCountFromWidth(parentRef.current.clientWidth))
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setColumnCount(getColumnCountFromWidth(entry.contentRect.width))
      }
    })
    observer.observe(parentRef.current)
    return () => observer.disconnect()
  }, [viewMode])

  const subfolderRowCount = React.useMemo(() => {
    if (viewMode !== "grid" || !subfolders || subfolders.length === 0) return 0
    return Math.ceil(subfolders.length / columnCount)
  }, [viewMode, subfolders, columnCount])

  const rowCount = React.useMemo(() => {
    if (viewMode === "list") return allItems.length
    return subfolderRowCount + Math.ceil(allItems.length / columnCount)
  }, [viewMode, allItems.length, columnCount, subfolderRowCount])

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === "grid" ? GRID_ROW_HEIGHT + GRID_ROW_GAP : LIST_ROW_HEIGHT),
    overscan: OVERSCAN,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  React.useEffect(() => {
    if (virtualItems.length === 0) return
    const lastVirtualItem = virtualItems[virtualItems.length - 1]
    if (!lastVirtualItem) return
    if (
      lastVirtualItem.index >= rowCount - 1 - OVERSCAN &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [virtualItems, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage])

  React.useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems()
    if (virtualItems.length > 0) {
      const firstVisibleRow = virtualItems[0]!.index
      if (viewMode === "grid") {
        previousFirstVisibleIndexRef.current = firstVisibleRow * columnCount
      } else {
        previousFirstVisibleIndexRef.current = firstVisibleRow
      }
    }
  })

  React.useEffect(() => {
    const itemIndex = previousFirstVisibleIndexRef.current
    if (itemIndex <= 0) return
    const targetRow =
      viewMode === "grid" ? Math.floor(itemIndex / columnCount) : itemIndex
    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(targetRow, { align: "start" })
    })
  }, [viewMode, columnCount, rowVirtualizer])

  const handleSortClick = (field: SortField) => {
    if (!onSortChange) return
    if (field === sortBy) {
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc")
    } else {
      onSortChange(field, "desc")
    }
  }

  const totalSize = React.useMemo(() => {
    return allItems.reduce((acc, item) => acc + item.fileSize, 0)
  }, [allItems])

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "grid" ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
              {Array.from({ length: columnCount * 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isError && allItems.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <IconAlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground/80">Failed to load media files</p>
          <p className="text-xs text-muted-foreground">{error?.message ?? "An unexpected error occurred"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-1">
          <IconRefresh className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    )
  }

  const canUpload =
    !!user &&
    (isAtLeastRole(user.role, ROLES.ADMIN) || Boolean(user.mediaBuyerId))

  if (allItems.length === 0 && (!subfolders || subfolders.length === 0 || viewMode !== "grid")) {
    if (folderId && folderName) {
      const truncatedName =
        folderName.length > 50
          ? `${folderName.slice(0, 50)}…`
          : folderName
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/80">
            <IconFolder className="size-8 text-muted-foreground/40" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-medium text-foreground/80">
              {truncatedName}
            </p>
            <p className="text-sm text-muted-foreground">
              This folder is empty
            </p>
          </div>
          {canUpload && onUploadClick && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={onUploadClick}
            >
              <IconUpload className="mr-2 size-4" />
              Upload to folder
            </Button>
          )}
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/60">
          <IconPhoto className="size-10 text-muted-foreground/30" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-base font-medium text-foreground/80">No media files yet</p>
          <p className="text-sm text-muted-foreground">Drag and drop files or click to upload</p>
        </div>
        {canUpload && onUploadClick && (
          <Button
            variant="default"
            size="sm"
            className="mt-1"
            onClick={onUploadClick}
          >
            <IconUpload className="mr-2 size-4" />
            Upload your first file
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <input
        ref={replaceFileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/quicktime,video/webm,application/pdf,font/woff,font/woff2,font/ttf,font/otf"
        onChange={onReplaceFileSelected}
      />
      {/* List View Header Row */}
      {viewMode === "list" && allItems.length > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-b border-l-2 border-l-transparent px-4 py-2.5 bg-muted/20">
          <Checkbox
            checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all files"
            className="opacity-100"
          />
          {SORT_COLUMNS.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => handleSortClick(col.key)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors",
                sortBy === col.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                col.key === "name" && "min-w-0 flex-1 text-left gap-3",
                col.key === "name" && "pl-[52px]",
                col.key === "fileType" && "w-20 shrink-0",
                col.key === "size" && "w-24 shrink-0 justify-end",
                col.key === "dateUploaded" && "w-28 shrink-0 justify-end",
              )}
            >
              {col.label}
              {sortBy === col.key && (
                sortOrder === "asc"
                  ? <IconArrowNarrowUp className="size-3.5" />
                  : <IconArrowNarrowDown className="size-3.5" />
              )}
            </button>
          ))}
          {/* Spacer for admin quick-actions column to align with list rows */}
          {isAdmin && <div className="w-7 shrink-0" />}
        </div>
      )}

      <div
        ref={parentRef}
        className="relative flex-1 overflow-auto"
        onContextMenu={(e) => {
          const target = e.target as HTMLElement
          const inCard = target.closest('[data-slot="context-menu-trigger"]')
          if (!inCard) {
            e.preventDefault()
            handleContextNewFolder()
          }
        }}
      >
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            if (viewMode === "grid") {
              if (virtualRow.index < subfolderRowCount) {
                const startIndex = virtualRow.index * columnCount
                const rowSubfolders = (subfolders ?? []).slice(startIndex, startIndex + columnCount)
                return (
                  <div
                    key={virtualRow.key}
                    className={cn("absolute left-0 top-0 grid w-full gap-3 px-4", virtualRow.index === 0 && "pt-4")}
                    style={{
                      height: `${virtualRow.size - GRID_ROW_GAP}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      marginBottom: `${GRID_ROW_GAP}px`,
                      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowSubfolders.map((folder) => (
                      <SubfolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={() => onFolderSelect?.(folder.id)}
                      />
                    ))}
                  </div>
                )
              }

              const fileRowIndex = virtualRow.index - subfolderRowCount
              const startIndex = fileRowIndex * columnCount
              const rowItems = allItems.slice(startIndex, startIndex + columnCount)

              return (
                <div
                  key={virtualRow.key}
                  className={cn("absolute left-0 top-0 grid w-full gap-3 px-4", subfolderRowCount === 0 && virtualRow.index === 0 && "pt-4")}
                  style={{
                    height: `${virtualRow.size - GRID_ROW_GAP}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    marginBottom: `${GRID_ROW_GAP}px`,
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map((item) => (
                    <GridCard
                      key={item.id}
                      file={item}
                      isAdmin={isAdmin}
                      isSelected={selectedFileIds.has(item.id)}
                      onToggleSelect={() => toggleFileSelection(item.id)}
                      onClick={() => onFileSelect?.(item)}
                      onContextDelete={handleContextDelete}
                      onContextMove={handleContextMove}
                      onContextCopyLink={handleContextCopyLink}
                      onContextDownload={handleContextDownload}
                      onReplace={handleReplaceFile}
                      isReplacing={item.id === activeReplacingFileId}
                    />
                  ))}
                </div>
              )
            }

            const item = allItems[virtualRow.index]
            if (!item) return null

            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 top-0 w-full px-0"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ListRow
                  file={item}
                  isAdmin={isAdmin}
                  isSelected={selectedFileIds.has(item.id)}
                  onToggleSelect={() => toggleFileSelection(item.id)}
                  onDelete={(fileId) => {
                    setSelectedFileIds(new Set([fileId]))
                    setShowDeleteConfirm(true)
                  }}
                  onClick={() => onFileSelect?.(item)}
                  onContextDelete={handleContextDelete}
                  onContextMove={handleContextMove}
                  onContextCopyLink={handleContextCopyLink}
                  onContextDownload={handleContextDownload}
                  onReplace={handleReplaceFile}
                  isReplacing={item.id === activeReplacingFileId}
                />
              </div>
            )
          })}
        </div>

        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2">
              <IconLoader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading more...</span>
            </div>
          </div>
        )}

        {!hasNextPage && allItems.length > 0 && !isFetchingNextPage && (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-muted-foreground/60">All files loaded</span>
          </div>
        )}

        {isError && allItems.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2">
              <IconAlertTriangle className="size-3.5 text-destructive" />
              <span className="text-xs text-destructive">Failed to load more</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs ml-1"
                onClick={() => void fetchNextPage()}
              >
                <IconRefresh className="mr-1 size-3" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex shrink-0 items-center justify-between border-t px-4 py-2 bg-muted/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums">{allItems.length}</span>
          <span>file{allItems.length !== 1 ? "s" : ""}</span>
          {allItems.length > 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="tabular-nums">{formatFileSize(totalSize)}</span>
            </>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-lg">
            <span className="text-sm font-medium tabular-nums">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-muted-foreground hover:text-foreground"
                disabled={isBulkActionPending}
                onClick={() => setShowMoveDialog(true)}
              >
                <IconFolderSymlink className="mr-1.5 size-4" />
                Move
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-destructive hover:text-destructive"
                disabled={isBulkActionPending}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <IconTrash className="mr-1.5 size-4" />
                Delete
              </Button>
            </div>
            {isBulkActionPending && (
              <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} file{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} selected file{selectedCount !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedCount} file{selectedCount !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showMoveDialog} onOpenChange={(open) => {
        setShowMoveDialog(open)
        if (!open) setMoveTargetFolderId(null)
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {selectedCount} file{selectedCount !== 1 ? "s" : ""} to folder</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="flex flex-col gap-1 pr-4">
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  moveTargetFolderId === null && "bg-accent font-medium",
                )}
                onClick={() => setMoveTargetFolderId(null)}
              >
                <IconFolder className="size-4 text-muted-foreground" />
                <span>Root (no folder)</span>
                {moveTargetFolderId === null && (
                  <IconCheck className="ml-auto size-4 text-primary" />
                )}
              </button>
              {allFolders?.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                    moveTargetFolderId === folder.id && "bg-accent font-medium",
                  )}
                  style={{ paddingLeft: `${(folder.depth ?? 0) * 16 + 12}px` }}
                  onClick={() => setMoveTargetFolderId(folder.id)}
                >
                  <IconFolder className="size-4 text-muted-foreground" />
                  <span className="truncate">{folder.name}</span>
                  {moveTargetFolderId === folder.id && (
                    <IconCheck className="ml-auto size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkMove}
              disabled={isBulkActionPending}
            >
              {isBulkActionPending && <IconLoader2 className="mr-2 size-4 animate-spin" />}
              Move {selectedCount} file{selectedCount !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Progress Popup */}
      {replaceItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-1.5 rounded-lg border bg-background p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/80">Replacing files</span>
            <button
              type="button"
              onClick={() => {
                for (const [fileId] of replaceProgressRef.current) {
                  dismissReplace(fileId)
                }
              }}
              className="flex size-5 items-center justify-center rounded hover:bg-accent"
            >
              <IconX className="size-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {replaceItems.map((r) => (
              <div key={r.fileId} className="flex items-center gap-2">
                {r.status === "uploading" ? (
                  <IconLoader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                ) : r.status === "success" ? (
                  <IconCheck className="size-3.5 shrink-0 text-green-600" />
                ) : (
                  <IconAlertTriangle className="size-3.5 shrink-0 text-destructive" />
                )}
                <span className="flex-1 truncate text-xs">{r.fileName}</span>
                {r.status === "uploading" && (
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{r.progress}%</span>
                )}
                {r.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => dismissReplace(r.fileId)}
                    className="flex size-4 items-center justify-center rounded hover:bg-accent"
                  >
                    <IconX className="size-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {replaceItems.some((r) => r.status !== "uploading") && (
            <button
              type="button"
              onClick={() => {
                const completed = replaceItems.filter((r) => r.status !== "uploading")
                for (const { fileId } of completed) {
                  dismissReplace(fileId)
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground text-center pt-1"
            >
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subfolder Card ──────────────────────────────────────────────────────────

interface SubfolderCardProps {
  folder: { id: string; name: string; fileCount: number }
  onClick?: () => void
}

function SubfolderCard({ folder, onClick }: SubfolderCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-card/50 p-6",
        "transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-3 group-hover:from-primary/15 group-hover:to-primary/10 transition-all group-hover:scale-105">
        <IconFolder className="size-7 text-primary/60 group-hover:text-primary/80 transition-colors" />
      </div>
      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors" title={folder.name}>
        {folder.name.length > 24 ? `${folder.name.slice(0, 24)}…` : folder.name}
      </span>
      {folder.fileCount > 0 && (
        <span className="mt-1 text-xs text-muted-foreground">
          {folder.fileCount} file{folder.fileCount !== 1 ? "s" : ""}
        </span>
      )}
    </button>
  )
}

// ─── Grid Card ───────────────────────────────────────────────────────────────

interface GridCardProps {
  file: MediaFile
  isAdmin: boolean
  isSelected: boolean
  isReplacing: boolean
  onToggleSelect: () => void
  onClick?: () => void
  onContextDelete?: (fileId: string) => void
  onContextMove?: (fileId: string) => void
  onContextCopyLink?: (cdnUrl: string | null) => void
  onContextDownload?: (cdnUrl: string | null) => void
  onReplace?: (fileId: string) => void
}

function GridCard({
  file,
  isAdmin,
  isSelected,
  isReplacing,
  onToggleSelect,
  onClick,
  onContextDelete,
  onContextMove,
  onContextCopyLink,
  onContextDownload,
  onReplace,
}: GridCardProps) {
  const Icon = getMimeIcon(file.mimeType)
  const isImage = file.mimeType.startsWith("image/")
  const isVideo = file.mimeType.startsWith("video/")
  const { ref: inViewRef, inView } = useInView({ threshold: 0.1 })
  const { posterUrl, isLoading: posterLoading } = useVideoPoster(isVideo ? file.cdnUrl : null, inView)

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.cdnUrl) {
      void navigator.clipboard.writeText(file.cdnUrl)
      toast.success("Link copied")
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          ref={inViewRef}
          type="button"
          className={cn(
            "group relative flex w-full flex-col overflow-hidden rounded-xl border bg-card",
            "transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-foreground/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "cursor-pointer text-left",
            isSelected && "border-primary ring-1 ring-primary shadow-sm",
          )}
          data-media-card="true"
          onClick={onClick}
        >
          {/* Thumbnail */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {isImage && file.cdnUrl ? (
              <>
                <img
                  src={`${file.cdnUrl}?width=300&height=300`}
                  alt={file.name}
                  className="size-full object-cover transition-all duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : isVideo && posterUrl ? (
              <>
                <img
                  src={posterUrl}
                  alt={file.name}
                  className="size-full object-cover transition-all duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-2 right-2 z-10">
                  <div className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm shadow-lg">
                    <IconPlayerPlayFilled className="size-4 ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                {posterLoading ? (
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground/30" />
                ) : (
                  <Icon className="size-12 text-muted-foreground/30" />
                )}
              </div>
            )}

            {isReplacing && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
                <IconLoader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
            {/* Selection Checkbox */}
            <div
              className={cn(
                "absolute left-2 top-2 z-20",
                "opacity-0 transition-opacity duration-150",
                "group-hover:opacity-100",
                isSelected && "opacity-100",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect()
              }}
            >
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-md border-2 transition-all",
                  "bg-background/80 backdrop-blur-sm",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-white/70 bg-background/60",
                )}
              >
                {isSelected && <IconCheck className="size-3.5" />}
              </div>
            </div>

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
              <span
                role="button"
                tabIndex={0}
                className="flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                title="Preview"
                onClick={(e) => { e.stopPropagation(); onClick?.() }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClick?.() } }}
              >
                <IconEye className="size-4" />
              </span>
              <span
                role="button"
                tabIndex={0}
                className="flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                title="Copy link"
                onClick={handleCopyLink}
                onKeyDown={(e) => { if (e.key === "Enter") handleCopyLink(e as unknown as React.MouseEvent) }}
              >
                <IconCopy className="size-4" />
              </span>
              {isAdmin && (
                <span
                  role="button"
                  tabIndex={0}
                  className="flex size-9 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect()
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggleSelect() } }}
                >
                  <IconTrash className="size-4" />
                </span>
              )}
            </div>
          </div>

          {/* File Info */}
          <div className="flex flex-col gap-1 px-3 pt-2.5 pb-3">
            <span className="truncate text-sm font-medium leading-snug text-foreground/90">{file.name}</span>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal leading-tight">
                {getMimeCategory(file.mimeType)}
              </Badge>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatFileSize(file.fileSize)}
              </span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onClick?.()}>
          <IconEye className="mr-2 size-4" />
          Preview
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onContextCopyLink?.(file.cdnUrl)}>
          <IconCopy className="mr-2 size-4" />
          Copy Link
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onContextDownload?.(file.cdnUrl)}>
          <IconDownload className="mr-2 size-4" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onContextMove?.(file.id)}>
          <IconFolderSymlink className="mr-2 size-4" />
          Move to folder
        </ContextMenuItem>
        {isAdmin && (
          <>
            <ContextMenuItem onClick={() => onReplace?.(file.id)}>
              <IconRefresh className="mr-2 size-4" />
              Replace
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onContextDelete?.(file.id)}
            >
              <IconTrash className="mr-2 size-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ─── List Row ────────────────────────────────────────────────────────────────

interface ListRowProps {
  file: MediaFile
  isAdmin: boolean
  isSelected: boolean
  isReplacing: boolean
  onToggleSelect: () => void
  onDelete?: (fileId: string) => void
  onClick?: () => void
  onContextDelete?: (fileId: string) => void
  onContextMove?: (fileId: string) => void
  onContextCopyLink?: (cdnUrl: string | null) => void
  onContextDownload?: (cdnUrl: string | null) => void
  onReplace?: (fileId: string) => void
}

function ListRow({
  file,
  isAdmin,
  isSelected,
  isReplacing,
  onToggleSelect,
  onDelete,
  onClick,
  onContextDelete,
  onContextMove,
  onContextCopyLink,
  onContextDownload,
  onReplace,
}: ListRowProps) {
  const Icon = getMimeIcon(file.mimeType)
  const isImage = file.mimeType.startsWith("image/")
  const isVideo = file.mimeType.startsWith("video/")
  const { ref: inViewRef, inView } = useInView({ threshold: 0.1 })
  const { posterUrl, isLoading: posterLoading } = useVideoPoster(isVideo ? file.cdnUrl : null, inView)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={inViewRef}
          className={cn(
            "group relative flex w-full items-center gap-3 border-b px-4 py-3",
            "transition-colors hover:bg-accent/30",
            isSelected && "bg-accent/20 border-l-2 border-l-primary",
            !isSelected && "border-l-2 border-l-transparent",
          )}
        >
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${file.name}`}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          />

          {/* Thumbnail + Name */}
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md"
            data-media-card="true"
            onClick={onClick}
          >
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted/80 shadow-sm">
              {isImage && file.cdnUrl ? (
                <img
                  src={`${file.cdnUrl}?width=80&height=80`}
                  alt={file.name}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : isVideo && posterUrl ? (
                <div className="relative size-full">
                  <img
                    src={posterUrl}
                    alt={file.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute bottom-0.5 right-0.5">
                    <div className="flex size-4 items-center justify-center rounded-full bg-black/60">
                      <IconPlayerPlayFilled className="size-2.5 ml-px text-white" />
                    </div>
                  </div>
                </div>
              ) : isVideo ? (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                  {posterLoading ? (
                    <IconLoader2 className="size-3.5 animate-spin text-muted-foreground/50" />
                  ) : (
                    <Icon className="size-4 text-muted-foreground/50" />
                  )}
                </div>
              ) : (
                <Icon className="size-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium leading-tight text-foreground/90 group-hover:text-foreground transition-colors">{file.name}</span>
            </div>
          </button>

          {/* Type */}
          <div className="w-20 shrink-0">
            <Badge variant="secondary" className="text-[10px] font-normal leading-tight">
              {getMimeCategory(file.mimeType)}
            </Badge>
          </div>

          {/* Size */}
          <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {formatFileSize(file.fileSize)}
          </span>

          {/* Date */}
          <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
            {formatDate(file.createdAt)}
          </span>

          {/* Quick Actions */}
          {isReplacing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
              <IconLoader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
          {isAdmin && (
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <span
                role="button"
                tabIndex={0}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                title="Replace file"
                onClick={(e) => {
                  e.stopPropagation()
                  onReplace?.(file.id)
                }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onReplace?.(file.id) } }}
              >
                <IconRefresh className="size-3.5" />
              </span>
              <span
                role="button"
                tabIndex={0}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                title="Delete file"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(file.id)
                }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete?.(file.id) } }}
              >
                <IconTrash className="size-3.5" />
              </span>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onClick?.()}>
          <IconEye className="mr-2 size-4" />
          Preview
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onContextCopyLink?.(file.cdnUrl)}>
          <IconCopy className="mr-2 size-4" />
          Copy Link
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onContextDownload?.(file.cdnUrl)}>
          <IconDownload className="mr-2 size-4" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onContextMove?.(file.id)}>
          <IconFolderSymlink className="mr-2 size-4" />
          Move to folder
        </ContextMenuItem>
        {isAdmin && (
          <>
            <ContextMenuItem onClick={() => onReplace?.(file.id)}>
              <IconRefresh className="mr-2 size-4" />
              Replace
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onContextDelete?.(file.id)}
            >
              <IconTrash className="mr-2 size-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
