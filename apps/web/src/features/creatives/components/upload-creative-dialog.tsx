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
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2, IconPhoto, IconUpload, IconX } from "@tabler/icons-react"
import * as React from "react"
import { fileToBase64, useUploadCreative } from "../queries"
import { MediaFilePicker, type FileItem } from "@/components/media/media-file-picker"
import { ProductSelect } from "@/components/product-select"
import { trpc } from "@/lib/trpc/client"

type UploadedCreative = Awaited<
  ReturnType<ReturnType<typeof useUploadCreative>["mutateAsync"]>
>

interface UploadCreativeDialogProps {
  showTrigger?: boolean
  onOpenChange?: (open: boolean) => void
  /** When set, the product is fixed to this ID and the product selector is hidden */
  productId?: string | null
  /** Custom trigger element rendered in place of the default Upload button */
  trigger?: React.ReactNode
  /** Pre-fills the creative name (e.g. from a search term) */
  defaultName?: string
  /** Called with the newly created creative after a successful upload/create */
  onUploaded?: (creative: UploadedCreative) => void
}

export function UploadCreativeDialog({
  showTrigger = true,
  onOpenChange,
  productId: scopedProductId,
  trigger,
  defaultName,
  onUploaded,
  ...props
}: UploadCreativeDialogProps &
  Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children">) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [name, setName] = React.useState(defaultName ?? "")
  const [altText, setAltText] = React.useState("")
  const [tagsInput, setTagsInput] = React.useState("")
  const [productId, setProductId] = React.useState<string | null>(
    scopedProductId ?? null
  )
  const isProductLocked = scopedProductId != null
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)

  // Media Library state
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [selectedMediaFile, setSelectedMediaFile] = React.useState<FileItem | null>(null)

  const uploadCreative = useUploadCreative()
  const utils = trpc.useUtils()
  const createCreative = trpc.creatives.create.useMutation({
    onSuccess: () => {
      utils.creatives.list.invalidate()
    },
  })

  // Keep the locked product in sync when it changes while the dialog is closed
  React.useEffect(() => {
    if (!open && scopedProductId != null) {
      setProductId(scopedProductId)
    }
  }, [open, scopedProductId])

  // Keep the pre-filled name in sync with the search term while the dialog is closed
  React.useEffect(() => {
    if (!open) {
      setName(defaultName ?? "")
    }
  }, [open, defaultName])

  const previewUrl = React.useMemo(() => {
    if (!file) return null
    return URL.createObjectURL(file)
  }, [file])

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const isImage = file?.type.startsWith("image/")
  const isVideo = file?.type.startsWith("video/")

  const handleFileSelect = React.useCallback((selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setSelectedMediaFile(null)
    if (!name) setName(selected.name.replace(/\.[^.]+$/, ""))
  }, [name])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }, [handleFileSelect])

  const handleFileInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFileSelect(selected)
  }, [handleFileSelect])

  const handleMediaPickerSelect = React.useCallback((selectedFiles: FileItem[]) => {
    if (selectedFiles.length > 0) {
      const mediaFile = selectedFiles[0]!
      setSelectedMediaFile(mediaFile)
      setFile(null)
      if (!name) setName(mediaFile.name.replace(/\.[^.]+$/, ""))
    }
  }, [name])

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
    if (!newOpen) {
      setFile(null)
      setName(defaultName ?? "")
      setAltText("")
      setTagsInput("")
      setProductId(scopedProductId ?? null)
      setDragOver(false)
      setSelectedMediaFile(null)
    }
  }, [onOpenChange, scopedProductId, defaultName])

  const handleUpload = async () => {
    if (!productId) return

    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined

    try {
      // Path 1: Selected from Media Library
      if (selectedMediaFile) {
        const created = await createCreative.mutateAsync({
          name: name || selectedMediaFile.name,
          productId,
          altText: altText || undefined,
          tags,
          // Pass media file data to link it to the creative
          mediaFileId: selectedMediaFile.id,
          cdnUrl: selectedMediaFile.url,
          mimeType: selectedMediaFile.mimeType,
          fileType: selectedMediaFile.mimeType ? selectedMediaFile.mimeType.split('/')[0] : undefined,
        })
        toast.success("Creative created from media library")
        onUploaded?.(created)
        closeRef.current?.click()
        return
      }

      // Path 2: Upload new file (routes through media library backend via creatives.upload)
      if (!file) return

      const base64 = await fileToBase64(file)
      const uploaded = await uploadCreative.mutateAsync({
        name: name || file.name,
        productId,
        file: base64,
        fileName: file.name,
        mimeType: file.type || undefined,
        altText: altText || undefined,
        tags,
      })
      toast.success("Creative uploaded")
      onUploaded?.(uploaded)
      closeRef.current?.click()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upload creative")
    }
  }

  const isPending = uploadCreative.isPending || createCreative.isPending
  const hasSource = file || selectedMediaFile
  const canUpload = hasSource && productId && !isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : showTrigger ? (
        <DialogTrigger
          render={
            <Button size="sm" className="h-9 gap-2">
              <IconUpload className="size-4" />
              Upload
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Creative</DialogTitle>
          <DialogDescription>
            Upload a file or choose from the Media Library. Supported formats: images, videos, documents.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* File source area */}
          {selectedMediaFile ? (
            // Show selected media file from library
            <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-primary bg-primary/5 p-6">
              {selectedMediaFile.url ? (
                <img
                  src={selectedMediaFile.url}
                  alt={selectedMediaFile.name}
                  className="mb-3 max-h-40 max-w-full rounded-md object-contain"
                />
              ) : (
                <IconPhoto className="mb-2 size-8 text-primary" />
              )}
              <p className="text-sm font-medium">{selectedMediaFile.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                From Media Library
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 size-6"
                onClick={() => {
                  setSelectedMediaFile(null)
                }}
              >
                <IconX className="size-4" />
              </Button>
            </div>
          ) : (
            // Drop zone for direct upload
            <div
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,video/*,application/pdf,text/plain,text/html"
              />
              {previewUrl && isImage ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mb-3 max-h-40 max-w-full rounded-md object-contain"
                />
              ) : previewUrl && isVideo ? (
                <video
                  src={previewUrl}
                  className="mb-3 max-h-40 max-w-full rounded-md"
                  controls
                />
              ) : file ? (
                <div className="mb-3 flex flex-col items-center gap-1 text-sm text-muted-foreground">
                  <IconUpload className="size-8" />
                  <span className="font-medium">{file.name}</span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <>
                  <IconUpload className="mb-2 size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop file here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Images, videos, PDFs, HTML, TXT up to 100MB
                  </p>
                </>
              )}
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 size-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <IconX className="size-4" />
                </Button>
              )}
            </div>
          )}

          {/* Choose from Media Library button */}
          {!selectedMediaFile && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={(e) => {
                e.stopPropagation()
                setMediaPickerOpen(true)
              }}
            >
              <IconPhoto className="size-4" />
              Choose from Media Library
            </Button>
          )}

          <div className="grid gap-3">
            {!isProductLocked && (
              <div className="grid gap-1.5">
                <Label htmlFor="product">Product *</Label>
                <ProductSelect
                  value={productId}
                  onChange={setProductId}
                  placeholder="Select product..."
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Creative name"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Accessibility description"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="banner, summer, campaign"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose
            ref={closeRef}
            render={<Button variant="outline">Cancel</Button>}
          />
          <Button
            aria-label="Upload creative"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {isPending && (
              <IconLoader2 className="mr-2 size-4 animate-spin" />
            )}
            {isPending
              ? selectedMediaFile ? "Creating..." : "Uploading..."
              : selectedMediaFile ? "Create Creative" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Media File Picker Dialog */}
      <MediaFilePicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaPickerSelect}
        multiple={false}
        accept={["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"]}
      />
    </Dialog>
  )
}
