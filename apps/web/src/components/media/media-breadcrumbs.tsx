"use client"

import { useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@adscrush/ui/components/breadcrumb"
import type { mediaFolders } from "@adscrush/db/schema"
import { Folder, Home } from "lucide-react"

interface BreadcrumbSegment {
  id: string | null
  name: string
}

interface MediaBreadcrumbsProps {
  folderId: string | null
  folders: Array<typeof mediaFolders.$inferSelect>
  onNavigate: (folderId: string | null) => void
}

function buildPath(
  folderId: string | null,
  folders: Array<typeof mediaFolders.$inferSelect>,
): BreadcrumbSegment[] {
  const map = new Map(folders.map((f) => [f.id, f]))
  const segments: BreadcrumbSegment[] = []
  let current = folderId ? map.get(folderId) : null
  while (current) {
    segments.unshift({ id: current.id, name: current.name })
    current = current.parentId ? map.get(current.parentId) : null
  }
  return segments
}

export function MediaBreadcrumbs({
  folderId,
  folders,
  onNavigate,
}: MediaBreadcrumbsProps) {
  const path = useMemo(() => buildPath(folderId, folders), [folderId, folders])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            asChild
            className="flex cursor-pointer items-center gap-1"
            onClick={() => onNavigate(null)}
          >
            <span>
              <Home className="size-3.5" />
              Media
            </span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {path.length > 0 && (
          <BreadcrumbSeparator />
        )}
        {path.map((segment, index) => {
          const isLast = index === path.length - 1
          return (
            <BreadcrumbItem key={segment.id ?? "root"}>
              {isLast ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  <Folder className="size-3.5" />
                  {segment.name}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink
                    asChild
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => onNavigate(segment.id)}
                  >
                    <span>
                      <Folder className="size-3.5" />
                      {segment.name}
                    </span>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
