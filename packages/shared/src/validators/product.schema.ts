import { z } from "zod"
import {
  PRODUCT_STATUS_VALUES,
  PRODUCT_VISIBILITY_VALUES,
} from "../constants/status"

// --- Sub-schemas ---

const mediaItemSchema = z.object({
  url: z.string().min(1, "Media URL is required"),
  type: z.enum(["image", "video", "3d-model"]),
  mediaFileId: z.string().optional(),
  position: z.number().int().min(0),
})

// --- Base object schema ---

const createProductBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be at most 255 characters")
    .transform((val) => val.trim())
    .pipe(z.string().min(1, "Product name is required")),
  advertiserId: z.string().min(1, "Advertiser is required"),
  categoryId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  description: z.string().max(50000).optional().nullable(),
  privateNote: z.string().optional().nullable(),
  status: z.enum(PRODUCT_STATUS_VALUES).default("active"),
  visibility: z.enum(PRODUCT_VISIBILITY_VALUES).default("public"),
  dailyCap: z.number().int().optional(),
  totalCap: z.number().int().optional(),
  quantity: z.number().int().min(0).max(999999).optional().default(0).nullable(),

  // Pricing fields
  price: z.number().min(0).max(999999999.99).optional().nullable(),
  compareAtPrice: z.number().min(0).max(999999999.99).optional().nullable(),
  costPerItem: z.number().min(0).max(999999999.99).optional().nullable(),
  // Media
  mediaItems: z.array(mediaItemSchema).max(20).default([]),

  // Metafield values
  metafieldValues: z.record(z.string(), z.string()).default({}),
})

// --- Create schema ---

export const createProductSchema = createProductBaseSchema.superRefine(
  (data, ctx) => {
    // Compare-at price warning: should exceed selling price
    if (
      data.compareAtPrice != null &&
      data.price != null &&
      data.compareAtPrice <= data.price
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Compare-at price should be greater than the selling price",
        path: ["compareAtPrice"],
      })
    }
  }
)

// --- Update schema (partial, without advertiserId) ---

export const updateProductSchema = createProductBaseSchema.partial().omit({
  advertiserId: true,
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
