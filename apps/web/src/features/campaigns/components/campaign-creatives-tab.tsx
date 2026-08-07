"use client"

import { CampaignCreativesList } from "./campaign-creatives-list"

interface CampaignCreativesTabProps {
  campaignId: string
  productId?: string | null
}

export function CampaignCreativesTab({ campaignId, productId }: CampaignCreativesTabProps) {
  return <CampaignCreativesList campaignId={campaignId} productId={productId} />
}
