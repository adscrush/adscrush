"use client"

import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import type { Creative } from "../queries"
import { File } from "lucide-react"
import { useRef } from "react"

interface PreviewCreativeDialogProps {
  creative: Creative | null
  onOpenChange?: (open: boolean) => void
}

export function PreviewCreativeDialog({
  creative,
  onOpenChange,
  ...props
}: PreviewCreativeDialogProps &
  Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children">) {
  const closeRef = useRef<HTMLButtonElement>(null)

  if (!creative) return null

  const isImage = creative.mimeType?.startsWith("image/")
  const isVideo = creative.mimeType?.startsWith("video/")
  const fileSize = creative.fileSize

  return (
    <Dialog onOpenChange={onOpenChange} {...props}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{creative.name}</DialogTitle>
          {creative.originalFileName && (
            <DialogDescription>{creative.originalFileName}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex items-center justify-center rounded-md bg-muted p-4">
          {isImage ? (
            <img
              src={creative.cdnUrl ?? undefined}
              alt={creative.altText ?? creative.name}
              className="max-h-[60vh] max-w-full rounded-md object-contain"
            />
          ) : isVideo ? (
            <video
              src={creative.cdnUrl ?? undefined}
              controls
              className="max-h-[60vh] max-w-full rounded-md"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center text-muted-foreground">
              <File className="size-16" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No preview available</p>
                <p className="text-xs">
                  {creative.mimeType ?? "Unknown format"}
                </p>
                {fileSize != null && (
                  <p className="text-xs">
                    {fileSize < 1024
                      ? `${fileSize} B`
                      : fileSize < 1024 * 1024
                        ? `${(fileSize / 1024).toFixed(1)} KB`
                        : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose
            ref={closeRef}
            render={<Button variant="outline">Close</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
