"use client"

import { ProductForm, type ProductFormValues } from "./product-form"

const CREATE_DEFAULTS: ProductFormValues = {
  name: "",
  advertiserId: "",
  categoryId: "",
  description: "",
  status: "active",
  visibility: "public",
  price: null,
  compareAtPrice: null,
  costPerItem: null,
  mediaItems: [],
  metafieldValues: {},
}

export function AddProductForm() {
  return <ProductForm mode="create" defaultValues={CREATE_DEFAULTS} />
}
