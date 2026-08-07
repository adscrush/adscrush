import { z } from "zod"

export const ClickQuerySchema = z.object({
  c: z.string().min(1, "Campaign ID is required"),
  aa: z.string().min(1, "Ad Account ID is required"),
  cr: z.string().optional(), // Creative ID
  f: z.string().optional(),
  lp: z.string().optional(),
  mo: z.string().optional(),
  aff_click_id: z.string().optional(),
  sub_aff_id: z.string().optional(),
  aff_sub1: z.string().optional(),
  aff_sub2: z.string().optional(),
  aff_sub3: z.string().optional(),
  aff_sub4: z.string().optional(),
  aff_sub5: z.string().optional(),
  aff_sub6: z.string().optional(),
  aff_sub7: z.string().optional(),
  aff_sub8: z.string().optional(),
  aff_sub9: z.string().optional(),
  aff_sub10: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  campaign: z.string().optional(),
})

export type ClickQuery = z.infer<typeof ClickQuerySchema>
