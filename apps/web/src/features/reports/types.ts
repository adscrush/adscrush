export interface DetailedPerformanceItem {
  offerId: string
  offerName: string
  mediaBuyerId: string
  mediaBuyerName: string
  lpId: string
  lpName: string
  country: string | null
  clicks: number
  conversions: number
  revenue: string
  payout: string
}

export interface DetailedPerformanceResponse {
  success: boolean
  data: DetailedPerformanceItem[]
}

export interface ReportOverview {
  clicks: number
  conversions: number
  revenue: number
  payout: number
  profit: number
  conversionRate: number
}

export interface ReportOverviewResponse {
  success: boolean
  data: ReportOverview
}

export interface MTDStatsItem {
  date: string
  clicks: number
  conversions: number
  revenue: number
  payout: number
}

export interface MTDStatsResponse {
  success: boolean
  data: {
    totals: {
      clicks: number
      conversions: number
      revenue: number
      payout: number
    }
    trend: MTDStatsItem[]
  }
}

