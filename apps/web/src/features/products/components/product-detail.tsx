"use client"

import { RichTextViewer } from "@/components/rich-text-viewer"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@adscrush/ui/components/card"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { IconEdit, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { useProduct } from "../queries"

interface ProductDetailProps {
  productId: string
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  paused: "outline",
  expired: "destructive",
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const { data: product, isLoading, error } = useProduct(productId)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-destructive">
        {error?.message ?? "Product not found"}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <IconArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {product.advertiser?.name ?? "No advertiser"}
              {product.category?.name ? ` · ${product.category.name}` : ""}
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href={`/products/${product.id}/edit`}>
            <IconEdit className="mr-2 size-3.5" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextViewer
                html={product.description}
                fallback="No description provided"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={STATUS_VARIANTS[product.status] ?? "secondary"}>
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <span className="text-sm capitalize">{product.visibility}</span>
              </div>
              {product.dailyCap && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Cap</span>
                  <span className="text-sm">{product.dailyCap}</span>
                </div>
              )}
              {product.totalCap && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cap</span>
                  <span className="text-sm">{product.totalCap}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image */}
          {product.image && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full rounded-md object-cover"
                />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
