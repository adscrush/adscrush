import "server-only"
import { getTrpcServer } from "@/lib/trpc/server"
import { type GetCampaignsSchema } from "./validations"
import {
  getCampaignsQueryOptions as getSharedOptions,
  getCampaignQueryOptions as getSharedCampaignOptions,
  getCampaignStatsQueryOptions as getSharedStatsOptions,
} from "./query-options"

export function getCampaignsQueryOptions(params: GetCampaignsSchema) {
  return getSharedOptions(params, async (p) => {
    const trpc = getTrpcServer()
    const data = await trpc.campaigns.list.query(p)

    return {
      data: data.items,
      pageCount: data.pageCount,
      meta: { total: data.total },
    }
  })
}

export function getCampaignQueryOptions(id: string) {
  return getSharedCampaignOptions(id, async (campaignId) => {
    const trpc = getTrpcServer()
    const data = await trpc.campaigns.byId.query({ id: campaignId })
    return { data }
  })
}

export function getCampaignStatsQueryOptions(campaignId: string) {
  return getSharedStatsOptions(campaignId, async (id) => {
    const trpc = getTrpcServer()
    const data = await trpc.campaigns.getStats.query({ campaignId: id })
    return { data }
  })
}
