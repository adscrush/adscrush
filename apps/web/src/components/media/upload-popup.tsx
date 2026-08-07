"use client"

import { Button } from "@adscrush/ui/components/button"
import { Progress } from "@adscrush/ui/components/progress"
import {
  IconCheck,
  IconAlertTriangle,
  IconCopy,
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconX,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react"
import * as React from "react"
import { cn } from "@adscrush/ui/lib/utils"
import { formatFileSize } from "./media-utils"

type UploadStatus = "queued" | "uploading" | "success" | "error" | "duplicate"

interface UploadItem {
  id: string
  file: File
  progress: number
  status: UploadStatus
  retries: number
  result: { cdnUrl?: string | null; isDuplicate?: boolean } | null
  error: string | null
}

interface UploadPopupProps {
  items: UploadItem[]
  onRetry: (itemId: string) => void
  onDismiss: (itemId: string) => void
  onClearCompleted: () => void
}

export function UploadPopup({ items, onRetry, onDismiss, onClearCompleted }: UploadPopupProps) {
  const [minimized, setMinimized] = React.useState(false)

  const hasActive = items.some((i) => i.status === "queued" || i.status === "uploading")
  const hasCompleted = items.some((i) => i.status === "success" || i.status === "duplicate" || i.status === "error")

  if (items.length === 0) return null

  const activeCount = items.filter((i) => i.status === "queued" || i.status === "uploading").length

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className={cn(
            "flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-lg transition-all hover:shadow-xl",
            hasActive && "border-primary/30",
          )}
        >
          {hasActive ? (
            <IconLoader2 className="size-4 animate-spin text-primary" />
          ) : (
            <IconCheck className="size-4 text-green-600" />
          )}
          <span className="text-sm font-medium">
            {activeCount > 0
              ? `${activeCount} uploading`
              : `${items.filter((i) => i.status === "success" || i.status === "duplicate").length} uploaded`}
          </span>
          <IconChevronUp className="size-4 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div className="flex max-h-[50vh] flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <IconUpload className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">
              Upload{activeCount > 0 ? ` (${activeCount})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Minimize"
            >
              <IconChevronDown className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Close"
            >
              <IconX className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-px p-1.5">
            {items.map((item) => (
              <UploadItemRow
                key={item.id}
                item={item}
                onRetry={onRetry}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        {hasCompleted && (
          <div className="flex shrink-0 justify-end border-t px-3 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCompleted}
              className="h-6 text-[10px] px-2"
            >
              Clear completed
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Upload Item Row ─────────────────────────────────────────────────────────

interface UploadItemRowProps {
  item: UploadItem
  onRetry: (id: string) => void
  onDismiss: (id: string) => void
}

export function UploadItemRow({ item, onRetry, onDismiss }: UploadItemRowProps) {
  const isImage = item.file.type.startsWith("image/")
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if ((item.status === "success" || item.status === "duplicate") && isImage) {
      const url = URL.createObjectURL(item.file)
      setThumbnailUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [item.status, item.file, isImage])

  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted">
        {(item.status === "success" || item.status === "duplicate") && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.file.name}
            className="size-7 rounded object-cover"
          />
        ) : item.status === "success" ? (
          <IconCheck className="size-3.5 text-green-600" />
        ) : item.status === "duplicate" ? (
          <IconCopy className="size-3.5 text-blue-600" />
        ) : item.status === "error" ? (
          <IconAlertTriangle className="size-3.5 text-destructive" />
        ) : item.status === "uploading" ? (
          <IconLoader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <IconUpload className="size-3.5 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-medium leading-tight text-foreground/90">
            {item.file.name}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
            {formatFileSize(item.file.size)}
          </span>
        </div>

        {item.status === "uploading" && (
          <div className="flex items-center gap-1.5">
            <Progress value={item.progress} className="h-1 flex-1" />
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{item.progress}%</span>
          </div>
        )}

        {item.status === "queued" && (
          <span className="text-[10px] text-muted-foreground">Queued</span>
        )}
        {item.status === "success" && (
          <span className="text-[10px] text-green-600">Complete</span>
        )}
        {item.status === "duplicate" && (
          <span className="text-[10px] text-blue-600">Duplicate</span>
        )}
        {item.status === "error" && (
          <span className="truncate text-[10px] text-destructive">
            {item.error ?? "Failed"}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {item.status === "error" && item.retries < 3 && (
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => onRetry(item.id)}
            title={`Retry (${item.retries}/3)`}
          >
            <IconRefresh className="size-3" />
          </button>
        )}
        {(item.status === "success" ||
          item.status === "duplicate" ||
          item.status === "error") && (
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => onDismiss(item.id)}
            title="Dismiss"
          >
            <IconX className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}
