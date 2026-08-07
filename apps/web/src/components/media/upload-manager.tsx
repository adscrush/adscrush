"use client"

import { IconUpload } from "@tabler/icons-react"
import * as React from "react"
import { cn } from "@adscrush/ui/lib/utils"
import { ALLOWED_MEDIA_MIME_TYPES } from "@adscrush/shared/validators/media.schema"

interface UploadManagerProps {
  onAddFiles: (files: FileList | File[]) => void
  accept?: string
}

export function UploadManager({ onAddFiles, accept }: UploadManagerProps) {
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        onAddFiles(e.dataTransfer.files)
      }
    },
    [onAddFiles],
  )

  const handleFileInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onAddFiles(e.target.files)
        e.target.value = ""
      }
    },
    [onAddFiles],
  )

  const acceptTypes = accept ?? ALLOWED_MEDIA_MIME_TYPES.join(",")

  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all",
        dragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-accent/30",
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileInput}
        accept={acceptTypes}
      />
      <div className={cn(
        "flex size-14 items-center justify-center rounded-2xl bg-muted mb-4 transition-colors",
        dragOver && "bg-primary/10",
      )}>
        <IconUpload className={cn(
          "size-6 transition-colors",
          dragOver ? "text-primary" : "text-muted-foreground",
        )} />
      </div>
      <p className="text-sm font-medium">
        {dragOver ? "Drop files here" : "Drop files here or click to browse"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Supports images, videos, documents &amp; fonts &mdash; up to 500MB each
      </p>
    </div>
  )
}
