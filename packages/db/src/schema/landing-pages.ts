import { pgTable, text, integer, index } from "drizzle-orm/pg-core"
import { funnels } from "./funnels"
import { LANDING_PAGE_STATUS, LANDING_PAGE_STATUS_VALUES } from "@adscrush/shared/constants/status"
import { createdAtColumn, deletedAtColumn, idColumn, updatedAtColumn } from "./_lib"

export const landingPages = pgTable(
  "landing_pages",
  {
    id: idColumn("landing_page"),
    funnelId: text("funnel_id")
      .notNull()
      .references(() => funnels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // The offer / landing page URL a visitor is routed to. Multiple per funnel.
    url: text("url").notNull(),
    weight: integer("weight"),
    status: text("status", { enum: LANDING_PAGE_STATUS_VALUES })
      .notNull()
      .default(LANDING_PAGE_STATUS.ACTIVE),
    deletedAt: deletedAtColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("landing_pages_funnel_id_idx").on(table.funnelId),
  ]
)

export type LandingPage = typeof landingPages.$inferSelect
export type NewLandingPage = typeof landingPages.$inferInsert
