"use client"

import { trpc } from "@/lib/trpc/client"
import { ContentShell } from "@/components/common/content-shell"
import { PageHeader } from "@/components/common/page-header"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Badge } from "@adscrush/ui/components/badge"
import { Card, CardContent } from "@adscrush/ui/components/card"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { IconSearch, IconPhoto, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useState } from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"

export function EmpCreativesClient() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebouncedValue(search, { wait: 300 })
  const [page, setPage] = useState(1)

  const { data, isLoading } = trpc.portal.myCreatives.useQuery({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
  })

  return (
    <ContentShell>
      <PageHeader title="My Creatives" description="Creatives from your campaigns" />

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search creatives..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`skel-${i}`} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <IconPhoto className="size-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">No creatives found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((creative) => (
              <Card key={creative.id} className="overflow-hidden transition-colors hover:bg-muted/30">
                <div className="relative aspect-[4/3] bg-muted">
                  {creative.thumbnailUrl ? (
                    <img
                      src={creative.thumbnailUrl}
                      alt={creative.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <IconPhoto className="size-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={creative.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {creative.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{creative.name}</p>
                  {creative.tags && creative.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {creative.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {data.pageCount > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
                disabled={page >= data.pageCount}
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </ContentShell>
  )
}
