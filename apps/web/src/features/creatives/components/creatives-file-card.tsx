"use client"

import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adscrush/ui/components/dropdown-menu"
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react"
import {
  EllipsisVertical,
  Eye,
  File,
  FileImage,
  FileVideo,
  Package,
  Trash2,
} from "lucide-react"
import type { Creative } from "../queries"
import { formatFileSize } from "@/components/media/media-utils"

interface CreativeFileCardProps {
  creative: Creative
  onPreview: (creative: Creative) => void
  onDelete: (creative: Creative) => void
}

function FileTypeIcon({ fileType, className }: { fileType: string | null; className?: string }) {
  if (fileType === "image") return <FileImage className={className} />
  if (fileType === "video") return <FileVideo className={className} />
  return <File className={className} />
}

export function CreativeFileCard({ creative, onPreview, onDelete }: CreativeFileCardProps) {
  const isImage = creative.mimeType?.startsWith("image/")
  const isVideo = creative.mimeType?.startsWith("video/")

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent/50">
      <button
        type="button"
        className="flex aspect-[4/3] w-full items-center justify-center bg-muted/30"
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-background/80">
                <FileVideo className="size-5" />
              </div>
            </div>
          </div>
        ) : (
          <FileTypeIcon
            fileType={creative.fileType}
            className="size-12 text-muted-foreground/40"
          />
        )}
      </button>

      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{creative.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(creative.fileSize)}
              {creative.mimeType && ` \u00B7 ${creative.mimeType}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onPreview(creative)}>
                <Eye className="mr-2 size-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(creative)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {creative.productId && (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
              <Package className="size-3" />
              Product
            </Badge>
          )}
          {creative.fileType && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {creative.fileType}
            </span>
          )}
          {creative.status === "active" ? (
            <Badge variant="outline" className="ml-auto gap-1 px-1.5 py-0 text-[10px]">
              <IconCircleCheckFilled className="size-3 text-green-600 dark:text-green-400" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto gap-1 px-1.5 py-0 text-[10px]">
              <IconCircleXFilled className="size-3 text-gray-500 dark:text-gray-400" />
              Inactive
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
