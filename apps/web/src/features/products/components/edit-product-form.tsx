"use client"

import { Loader2 } from "lucide-react"

import { useProductForEdit } from "../queries"
import { ProductForm, type ProductFormValues } from "./product-form"

interface EditProductFormProps {
  productId: string
}

export function EditProductForm({ productId }: EditProductFormProps) {
  const { data, isLoading, error } = useProductForEdit(productId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" />
        Loading product…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-destructive">
        {error?.message ?? "Product not found"}
      </div>
    )
  }

  const defaultValues: ProductFormValues = {
    name: data.name,
    advertiserId: data.advertiserId,
    categoryId: data.categoryId ?? "",
    image: data.image ?? undefined,
    description: data.description ?? "",
    privateNote: data.privateNote ?? undefined,
    status: data.status,
    visibility: data.visibility,
    dailyCap: data.dailyCap,
    totalCap: data.totalCap,
    quantity: data.quantity,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    costPerItem: data.costPerItem,
    mediaItems: data.mediaItems,
    metafieldValues: data.metafieldValues,
  }

  return (
    <ProductForm
      key={productId}
      mode="edit"
      productId={productId}
      defaultValues={defaultValues}
    />
  )
}
