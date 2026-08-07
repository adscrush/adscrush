"use client"

import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { formatDate } from "@adscrush/shared/lib/format"
import { IconEdit } from "@tabler/icons-react"
import Link from "next/link"
import { PermissionGate } from "@/components/permission-gate"
import { useFunnel } from "../queries"
import { FunnelLandingPages } from "./funnel-landing-pages"
import { LanguageCell } from "./language-cell"

interface FunnelDetailProps {
  id: string
}

export function FunnelDetailView({ id }: FunnelDetailProps) {
  const { data: funnel, isLoading } = useFunnel(id)

  if (isLoading) {
    return <FunnelDetailSkeleton />
  }

  if (!funnel) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Funnel not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The funnel you are looking for does not exist.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{funnel.name}</h1>
          <Badge variant={funnel.status === "active" ? "default" : "secondary"} className="uppercase">
            {funnel.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="funnels.edit">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/funnels/${id}/edit`}>
                <IconEdit className="mr-2 size-4" />
                Edit
              </Link>
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Product</dt>
              <dd className="mt-1 text-sm font-medium">
                {funnel.product ? (
                  <Link href={`/products/${funnel.product.id}`} className="text-primary hover:underline">
                    {funnel.product.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Language</dt>
              <dd className="mt-1 text-sm">
                <LanguageCell id={funnel.language} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Domain</dt>
              <dd className="mt-1 text-sm">{funnel.domain || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Page URL</dt>
              <dd className="mt-1 text-sm font-mono text-xs">{funnel.pageUrl || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Thank You Page URL</dt>
              <dd className="mt-1 text-sm font-mono text-xs">{funnel.thankYouPageUrl || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">
                {formatDate(funnel.createdAt, { year: "numeric", month: "short", day: "numeric" })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <FunnelLandingPages funnel={funnel} />
    </div>
  )
}

function FunnelDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
