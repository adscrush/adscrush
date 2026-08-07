import { z } from "zod"
import { type Creative } from "@adscrush/db/schema"
import { CREATIVE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { getFiltersStateParser, getSortingStateParser } from "@adscrush/shared/lib/query-parser"

// ─── Folder Types ────────────────────────────────────────────────────────────

export interface CreativeFolderOutputType {
  id: string
  name: string
  parentId: string | null
  productId: string
  createdAt: Date
  updatedAt: Date
  children?: CreativeFolderOutputType[]
  creativeCount?: number
}

export const creativeFolderOutputSchema: z.ZodType<CreativeFolderOutputType> = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  productId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  children: z.array(z.lazy(() => creativeFolderOutputSchema)).optional(),
  creativeCount: z.number().optional(),
})

export type CreativeFolderOutput = z.infer<typeof creativeFolderOutputSchema>

// ─── Output Types ────────────────────────────────────────────────────────────

export const creativeFileOutputSchema = z.object({
  id: z.string(),
  creativeId: z.string(),
  mediaFileId: z.string().nullable(),
  fileType: z.string().nullable(),
  cdnUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  fileSize: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  originalFileName: z.string().nullable().optional(),
  sortOrder: z.number(),
  createdAt: z.date(),
})

export const creativeOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileType: z.string().nullable(),
  cdnUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  productId: z.string(),
  folderId: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  duration: z.number().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  originalFileName: z.string().nullable().optional(),
  altText: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  status: z.enum(CREATIVE_STATUS_VALUES),
  createdAt: z.date(),
  updatedAt: z.date(),
  files: z.array(creativeFileOutputSchema).default([]),
})

export type CreativeOutput = z.infer<typeof creativeOutputSchema>

// ─── Input Types ─────────────────────────────────────────────────────────────

export const listCreativesInputSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(10),
  sort: getSortingStateParser<Creative>().default([{ id: "createdAt", desc: true }]),
  filters: getFiltersStateParser().default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  search: z.string().optional(),
  status: z.array(z.enum(CREATIVE_STATUS_VALUES)).optional(),
  productId: z.string().optional(),
  folderId: z.string().nullable().optional(),
  tag: z.string().optional(),
})

export type ListCreativesInput = z.infer<typeof listCreativesInputSchema>
