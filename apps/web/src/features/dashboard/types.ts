

export interface CustomerSegment {
  segment: string
  count: number
  trend: number
  color: string
  share: number
}

export interface GeographyItem {
  countryCode: string
  countryName: string
  flag: string
  total: number
  clicks: number
  conversions: number
  lat: number
  lng: number
}

export interface DashboardSummary {
  totalRevenue: number
  totalPayout: number
  totalProfit: number
  conversionRate: number
  activeProducts: number
  totalConversions: number
  totalClicks: number
  currency: string
}

export interface DashboardTrends {
  revenueChange: number
  conversionsChange: number
  activeProductsChange: number
  clicksChange: number
  conversionRateChange: number
  profitChange: number
  revenueComparisons: {
    "4w": number
    "13w": number
    "12m": number
  }
}

export interface RevenuePeriod {
  period: string
  revenue: number
  clicks: number
  conversions: number
}

export interface ActiveProductItem {
  id: string
  name: string
  category: string
  status: string
  clicks: number
  conversions: number
  revenue: number
  payout: number
  lastConversion: string | null
}

export interface BrowserBreakdownItem {
  browser: string
  clicks: number
}

export interface HourlyDataPoint {
  hour: number
  clicks: number
  conversions: number
}

export interface ConversionTrendPoint {
  date: string
  clicks: number
  conversions: number
  cr: number
}

export interface TopMediaBuyerItem {
  id: string
  name: string
  email: string
  clicks: number
  conversions: number
  revenue: number
  conversionRate: number
}

export interface TrafficBySourceItem {
  source: string
  clicks: number
  conversions: number
}

export interface DashboardResponse {
  summary: DashboardSummary
  trends: DashboardTrends
  revenueMode: "daily" | "monthly"
  revenueByPeriod: RevenuePeriod[]
  customerSegments: CustomerSegment[]
  geography: GeographyItem[]
  activeProductsList: ActiveProductItem[]
  browserBreakdown?: BrowserBreakdownItem[]
  hourlyData?: HourlyDataPoint[]
  conversionTrend?: ConversionTrendPoint[]
  topMediaBuyers?: TopMediaBuyerItem[]
  trafficBySource?: TrafficBySourceItem[]
}
