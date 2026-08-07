import { eq } from "@adscrush/db/drizzle"
import { products, productMedia, productMetafieldValues, type Product, type ProductMedia } from "@adscrush/db/schema"
import { TRPCError } from "@trpc/server"
import { slugify } from "@adscrush/shared/lib/slugify"
import { guessMimeType } from "@adscrush/shared/constants/media"
import type { Database } from "@adscrush/db"
import type { ListProductsInput } from "./products.types"
import * as repository from "./products.repository"
import { validateAdvertiserAccess, throwNotFound, throwInternalError, isBunnyUrl, deleteBunnyFile, createStorageClient, createCDNClient } from "~/lib/helpers"
import { logger } from "~/lib/logger"



// ─── Product Operations ──────────────────────────────────────────────────────

export async function listProducts(
  db: Database,
  input: ListProductsInput,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  return repository.findProducts(db, input, scope)
}

export async function getProductById(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const product = await repository.findProductById(db, id)

  if (!product) {
    throwNotFound("Product")
  }

  validateAdvertiserAccess(scope, product.advertiserId)
  return product
}

export async function getProductForEdit(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const product = await repository.findProductForEdit(db, id)

  if (!product) {
    throwNotFound("Product")
  }

  validateAdvertiserAccess(scope, product.advertiserId)

  const [mediaRows, metafieldRows] = await Promise.all([
    repository.findProductMedia(db, id),
    repository.findProductMetafields(db, id),
  ])

  const mediaItems = mediaRows.map((m) => ({
    url: m.url,
    type: m.type,
    mediaFileId: m.mediaFileId ?? undefined,
    position: m.position,
  }))

  const metafieldValues: Record<string, string> = {}
  for (const row of metafieldRows) {
    metafieldValues[row.metafieldId] = row.value
  }

  return {
    id: product.id,
    name: product.name,
    advertiserId: product.advertiserId,
    categoryId: product.categoryId,
    image: product.image,
    description: product.description,
    privateNote: product.privateNote,
    status: product.status,
    visibility: product.visibility,
    dailyCap: product.dailyCap ?? undefined,
    totalCap: product.totalCap ?? undefined,
    quantity: product.quantity ?? 0,
    price: product.price != null ? Number(product.price) : null,
    compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
    costPerItem: product.costPerItem != null ? Number(product.costPerItem) : null,
    mediaItems,
    metafieldValues,
  }
}

export async function createProduct(
  db: Database,
  input: {
    name: string
    advertiserId: string
    categoryId?: string | null
    image?: string | null
    description?: string | null
    privateNote?: string | null
    status: Product["status"]
    visibility: Product["visibility"]
    dailyCap?: number | null
    totalCap?: number | null
    quantity?: number | null
    price?: number | null
    compareAtPrice?: number | null
    costPerItem?: number | null
    mediaItems: Array<{ url: string; type: ProductMedia["type"]; mediaFileId?: string | null; position: number }>
    metafieldValues: Record<string, string>
  },
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  validateAdvertiserAccess(scope, input.advertiserId)

  const { mediaItems, metafieldValues, ...productData } = input

  // Auto-sync first media item to image field if image is not set
  const primaryImage = productData.image ?? mediaItems?.[0]?.url ?? null

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert the product
      const [product] = await tx.insert(products).values({
        name: productData.name,
        advertiserId: productData.advertiserId,
        categoryId: productData.categoryId ?? null,
        image: primaryImage,
        description: productData.description ?? null,
        privateNote: productData.privateNote ?? null,
        status: productData.status,
        visibility: productData.visibility,
        dailyCap: productData.dailyCap,
        totalCap: productData.totalCap,
        quantity: productData.quantity != null ? productData.quantity : 0,
        price: productData.price != null ? String(productData.price) : null,
        compareAtPrice: productData.compareAtPrice != null ? String(productData.compareAtPrice) : null,
        costPerItem: productData.costPerItem != null ? String(productData.costPerItem) : null,
      }).returning()

      if (!product) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        })
      }

      const productId = product.id

      // 2. Insert media items
      if (mediaItems.length > 0) {
        await tx.insert(productMedia).values(
          mediaItems.map((item) => ({
            productId,
            url: item.url,
            type: item.type,
            mediaFileId: item.mediaFileId ?? null,
            position: item.position,
          }))
        )
      }

      // 3. Insert metafield values
      const metafieldEntries = Object.entries(metafieldValues)
      if (metafieldEntries.length > 0) {
        await tx.insert(productMetafieldValues).values(
          metafieldEntries.map(([metafieldId, value]) => ({
            productId,
            metafieldId,
            value,
          }))
        )
      }

      return { id: productId }
    })

    return result
  } catch (error) {
    if (error instanceof TRPCError) throw error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create product record",
    })
  }
}

export async function updateProduct(
  db: Database,
  id: string,
  data: {
    name?: string
    categoryId?: string | null
    description?: string | null
    privateNote?: string | null
    status?: Product["status"]
    visibility?: Product["visibility"]
    dailyCap?: number | null
    totalCap?: number | null
    quantity?: number | null
    price?: number | null
    compareAtPrice?: number | null
    costPerItem?: number | null
    mediaItems?: Array<{ url: string; type: ProductMedia["type"]; mediaFileId?: string | null; position: number }>
    metafieldValues?: Record<string, string>
  },
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  const existingProduct = await repository.findProductForEdit(db, id)
  if (!existingProduct) {
    throwNotFound("Product")
  }

  validateAdvertiserAccess(scope, existingProduct.advertiserId)

  const oldImage = existingProduct.image

  const {
    mediaItems,
    metafieldValues,
    price,
    compareAtPrice,
    costPerItem,
    ...restData
  } = data

  // Convert numeric fields from number to string for Drizzle numeric columns
  const baseData: Record<string, unknown> = { ...restData }
  if (price !== undefined) {
    baseData.price = price != null ? String(price) : null
  }
  if (compareAtPrice !== undefined) {
    baseData.compareAtPrice = compareAtPrice != null ? String(compareAtPrice) : null
  }
  if (costPerItem !== undefined) {
    baseData.costPerItem = costPerItem != null ? String(costPerItem) : null
  }

  // Auto-sync image from the first media item when media items change.
  if (mediaItems !== undefined) {
    baseData.image = mediaItems.length > 0 ? mediaItems[0]!.url : null
  }

  try {
    const product = await db.transaction(async (tx) => {
      let updated = existingProduct
      if (Object.keys(baseData).length > 0) {
        const [row] = await tx
          .update(products)
          .set(baseData)
          .where(eq(products.id, id))
          .returning()
        if (!row) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update product",
          })
        }
        updated = row
      }

      // Re-sync media items
      if (mediaItems !== undefined) {
        await tx.delete(productMedia).where(eq(productMedia.productId, id))
        if (mediaItems.length > 0) {
          await tx.insert(productMedia).values(
            mediaItems.map((item) => ({
              productId: id,
              url: item.url,
              type: item.type,
              mediaFileId: item.mediaFileId ?? null,
              position: item.position,
            }))
          )
        }
      }

      // Re-sync metafield values
      if (metafieldValues !== undefined) {
        await tx.delete(productMetafieldValues).where(eq(productMetafieldValues.productId, id))
        const entries = Object.entries(metafieldValues)
        if (entries.length > 0) {
          await tx.insert(productMetafieldValues).values(
            entries.map(([metafieldId, value]) => ({ productId: id, metafieldId, value }))
          )
        }
      }

      return updated
    })

    // Clean up the previous CDN image if the base image changed
    const newImage = baseData.image as string | null | undefined
    if (newImage && oldImage && oldImage !== newImage && isBunnyUrl(oldImage)) {
      try {
        await deleteBunnyFile(oldImage)
      } catch {
        const log = logger({ productId: id, operation: "cleanupImage" })
        log.warn(`Failed to delete old product image from Bunny Storage`, { oldImage })
      }
    }

    return product
  } catch (error) {
    if (error instanceof TRPCError) throw error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update product record",
    })
  }
}

export async function deleteProduct(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const existing = await repository.findProductForDelete(db, id)

  if (!existing) {
    throwNotFound("Product")
  }

  validateAdvertiserAccess(scope, existing.advertiserId)

  if (existing.image && isBunnyUrl(existing.image)) {
    try {
      await deleteBunnyFile(existing.image)
    } catch {
      const log = logger({ productId: id, operation: "deleteImage" })
      log.warn(`Failed to delete product image from Bunny Storage`, { image: existing.image })
    }
  }

  const deleted = await repository.deleteProduct(db, id)

  if (!deleted) {
    throwInternalError("Failed to delete product")
  }

  return { success: true }
}

export async function getProductPopover(db: Database, id: string, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  const product = await repository.findProductPopover(db, id)

  if (!product) {
    throwNotFound("Product")
  }

  validateAdvertiserAccess(scope, product.advertiser!.id)
  return product
}

export async function uploadImage(
  db: Database,
  input: {
    advertiserId: string
    file: string
    fileName: string
    mimeType?: string
  },
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] }
) {
  validateAdvertiserAccess(scope, input.advertiserId)

  const advertiser = await repository.findAdvertiserName(db, input.advertiserId)
  if (!advertiser) {
    throwNotFound("Advertiser")
  }

  const storage = createStorageClient()
  const cdn = createCDNClient()

  const mimeType = input.mimeType ?? guessMimeType(input.fileName)
  const fileBuffer = Buffer.from(input.file, "base64")
  const advertiserSlug = slugify(advertiser.name)
  const prefix = `products/${advertiserSlug}`
  const result = await storage.upload(prefix, input.fileName, new Uint8Array(fileBuffer), mimeType)
  const cdnUrl = cdn.buildUrl(result.cdnUrl)

  return { cdnUrl }
}

export async function searchProducts(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { q?: string; limit: number; ids?: string[] }
) {
  return repository.searchProducts(db, scope, options)
}

export async function getProductOptions(
  db: Database,
  scope: { isAllAdvertisers: boolean; advertiserIds: string[] },
  options: { search?: string; limit: number }
) {
  return repository.getProductOptions(db, scope, options)
}

export async function getStatusCounts(db: Database, scope: { isAllAdvertisers: boolean; advertiserIds: string[] }) {
  return repository.getStatusCounts(db, scope)
}

export async function bulkUpdateStatus(db: Database, ids: string[], status: Product["status"]) {
  return repository.bulkUpdateStatus(db, ids, status)
}

export async function bulkDelete(db: Database, ids: string[]) {
  return repository.bulkDelete(db, ids)
}
