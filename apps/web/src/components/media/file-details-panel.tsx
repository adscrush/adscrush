"use client"

import { useEffect, useRef } from "react"
import { cn } from "@adscrush/ui/lib/utils"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import { Separator } from "@adscrush/ui/components/separator"
import {
  IconX,
  IconFileDescription,
  IconCopy,
  IconCalendar,
  IconUser,
  IconFolder,
  IconDimensions,
  IconWeight,
} from "@tabler/icons-react"
import { toast } from "@adscrush/ui/sonner"
import { trpc } from "@/lib/trpc/client"
import type { MediaFile } from "@adscrush/db/schema"
import { getMimeIcon, getMimeCategory, formatFileSize } from "./media-utils"

interface FileDetailsPanelProps {
  file: MediaFile | null
  onClose: () => void
}

function formatDate(date: Date | string | null): string {
  if (!date) return "\u2014"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function FileDetailsPanel({ file, onClose }: FileDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest?.("[data-media-card]")
      ) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  if (!file) return null

  const isImage = file.mimeType.startsWith("image/")
  const isVideo = file.mimeType.startsWith("video/")
  const Icon = getMimeIcon(file.mimeType)

  const { data: folders } = trpc.mediaFolders.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const folderName = file.folderId
    ? folders?.find((f) => f.id === file.folderId)?.name ?? "\u2014"
    : "Root"

  const ownerName = (file as Record<string, unknown>).uploaderName as string | null ?? file.uploadedBy

  const handleCopyUrl = () => {
    if (file.cdnUrl) {
      void navigator.clipboard.writeText(file.cdnUrl)
      toast.success("URL copied to clipboard")
    }
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "flex w-[340px] shrink-0 flex-col overflow-hidden border-l bg-background",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{file.name}</h3>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={onClose}
          aria-label="Close"
        >
          <IconX className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted/50 p-4">
          {isImage && file.cdnUrl ? (
            <img
              src={`${file.cdnUrl}?width=640&height=640`}
              alt={file.name}
              className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
            />
          ) : isVideo && file.cdnUrl ? (
            <video
              src={file.cdnUrl}
              className="max-h-full max-w-full rounded-lg"
              controls
              preload="metadata"
            />
          ) : (
            <Icon className="size-20 text-muted-foreground/30" />
          )}
        </div>

        {/* Quick Actions */}
        {file.cdnUrl && (
          <div className="px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCopyUrl}
            >
              <IconCopy className="size-4" />
              Copy URL
            </Button>
          </div>
        )}

        <Separator />

        {/* Details */}
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Details
            </h4>
            <div className="space-y-3">
              <DetailRow
                icon={IconFileDescription}
                label="Type"
                value={getMimeCategory(file.mimeType)}
                badge
              />
              <DetailRow
                icon={IconFileDescription}
                label="MIME"
                value={file.mimeType}
              />
              <DetailRow
                icon={IconWeight}
                label="Size"
                value={formatFileSize(file.fileSize)}
              />
              {file.width && file.height && (
                <DetailRow
                  icon={IconDimensions}
                  label="Dimensions"
                  value={`${file.width}\u00D7${file.height}px`}
                />
              )}
              <DetailRow
                icon={IconFolder}
                label="Folder"
                value={folderName}
              />
              <DetailRow
                icon={IconUser}
                label="Uploaded by"
                value={ownerName}
              />
              <DetailRow
                icon={IconCalendar}
                label="Created"
                value={formatDate(file.createdAt)}
              />
              <DetailRow
                icon={IconCalendar}
                label="Modified"
                value={formatDate(file.updatedAt)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  badge?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <Badge variant="secondary" className="mt-0.5 text-[10px] font-normal">
            {value}
          </Badge>
        ) : (
          <p className="text-xs font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}
