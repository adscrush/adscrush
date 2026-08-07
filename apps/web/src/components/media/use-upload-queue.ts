"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { trpc } from "@/lib/trpc/client"
import { type ALLOWED_MEDIA_MIME_TYPES } from "@adscrush/shared/validators/media.schema"

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

interface UploadQueueActions {
  items: UploadItem[]
  addFiles: (files: FileList | File[]) => void
  retryUpload: (itemId: string) => void
  dismissItem: (itemId: string) => void
  clearCompleted: () => void
  hasActive: boolean
}

const MAX_CONCURRENT = 10
const MAX_RETRIES = 3
const PROGRESS_INTERVAL = 500

function generateId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getDeduplicationKey(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1] ?? ""
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useUploadQueue(
  folderId?: string | null,
  onUploadComplete?: () => void,
): UploadQueueActions {
  const [items, setItems] = useState<UploadItem[]>([])
  const itemsRef = useRef<UploadItem[]>([])
  const activeCountRef = useRef(0)
  const dedupGuardRef = useRef<Set<string>>(new Set())
  const uploadingIdsRef = useRef<Set<string>>(new Set())
  const processingRef = useRef(false)
  const processQueueRef = useRef<() => void>(() => {})
  const autoRemoveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const uploadMutation = trpc.media.upload.useMutation()

  const hasActive = items.some((i) => i.status === "queued" || i.status === "uploading")

  // Keep ref in sync
  itemsRef.current = items

  useEffect(() => {
    const timers = autoRemoveTimersRef.current
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const scheduleAutoRemove = useCallback((itemId: string) => {
    const existing = autoRemoveTimersRef.current.get(itemId)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      autoRemoveTimersRef.current.delete(itemId)
    }, 4000)
    autoRemoveTimersRef.current.set(itemId, timer)
  }, [])

  const uploadFile = useCallback(
    async (itemId: string, file: File, retryCount = 0) => {
      let progress = 0
      const interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90)
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId && item.status === "uploading"
              ? { ...item, progress: Math.round(progress) }
              : item,
          ),
        )
      }, PROGRESS_INTERVAL)

      try {
        const base64 = await fileToBase64(file)
        const result = await uploadMutation.mutateAsync({
          file: base64,
          fileName: file.name,
          mimeType: file.type as (typeof ALLOWED_MEDIA_MIME_TYPES)[number],
          folderId: folderId ?? undefined,
        })

        clearInterval(interval)

        const isDuplicate = result.isDuplicate
        const finalStatus: UploadStatus = isDuplicate ? "duplicate" : "success"

        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: finalStatus,
                  progress: 100,
                  result: { cdnUrl: result.mediaFile.cdnUrl, isDuplicate },
                }
              : item,
          ),
        )

        if (finalStatus === "success") {
          scheduleAutoRemove(itemId)
        }

        const key = getDeduplicationKey(file)
        uploadingIdsRef.current.delete(itemId)
        dedupGuardRef.current.delete(key)

        onUploadComplete?.()
      } catch (error) {
        clearInterval(interval)

        const errorMessage =
          error instanceof Error ? error.message : "Upload failed"

        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: "error", progress: 0, error: errorMessage }
              : item,
          ),
        )

        if (retryCount >= MAX_RETRIES) {
          uploadingIdsRef.current.delete(itemId)
          const key = getDeduplicationKey(file)
          dedupGuardRef.current.delete(key)
        }
      } finally {
        activeCountRef.current--
        processQueueRef.current()
      }
    },
    [folderId, onUploadComplete, uploadMutation, scheduleAutoRemove],
  )

  const processQueue = useCallback(() => {
    if (processingRef.current) return
    processingRef.current = true

    const current = itemsRef.current
    const queued = current.filter(
      (item) => item.status === "queued" && !uploadingIdsRef.current.has(item.id),
    )
    const slots = MAX_CONCURRENT - activeCountRef.current

    if (slots <= 0 || queued.length === 0) {
      processingRef.current = false
      return
    }

    const toStart = queued.slice(0, slots)
    for (const item of toStart) {
      uploadingIdsRef.current.add(item.id)
    }

    setItems((prev) =>
      prev.map((item) =>
        toStart.some((t) => t.id === item.id)
          ? { ...item, status: "uploading" as UploadStatus, progress: 0 }
          : item,
      ),
    )

    for (const item of toStart) {
      activeCountRef.current++
      void uploadFile(item.id, item.file)
    }

    processingRef.current = false
  }, [uploadFile])

  processQueueRef.current = processQueue

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadItem[] = []
      const rejected: string[] = []

      for (const file of Array.from(files)) {
        const key = getDeduplicationKey(file)
        if (dedupGuardRef.current.has(key)) {
          rejected.push(file.name)
          continue
        }
        dedupGuardRef.current.add(key)
        newItems.push({
          id: generateId(),
          file,
          progress: 0,
          status: "queued" as UploadStatus,
          retries: 0,
          result: null,
          error: null,
        })
      }

      if (newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems])
        // processQueue uses itemsRef, but ref sync happens after render.
        // So we need to sync ref manually before processing.
        const updated = [...itemsRef.current, ...newItems]
        itemsRef.current = updated
        processQueue()
      }
    },
    [processQueue],
  )

  const retryUpload = useCallback(
    (itemId: string) => {
      const item = itemsRef.current.find(
        (i) => i.id === itemId && i.status === "error" && i.retries < MAX_RETRIES,
      )
      if (!item) return

      uploadingIdsRef.current.add(itemId)
      activeCountRef.current++

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, status: "uploading" as UploadStatus, progress: 0, retries: i.retries + 1, error: null }
            : i,
        ),
      )

      void uploadFile(itemId, item.file, item.retries + 1)
    },
    [uploadFile],
  )

  const dismissItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCompleted = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) {
        if (item.status === "success" || item.status === "duplicate") {
          const timer = autoRemoveTimersRef.current.get(item.id)
          if (timer) {
            clearTimeout(timer)
            autoRemoveTimersRef.current.delete(item.id)
          }
        }
      }
      return prev.filter((item) => item.status !== "success" && item.status !== "duplicate")
    })
  }, [])

  return { items, addFiles, retryUpload, dismissItem, clearCompleted, hasActive }
}
