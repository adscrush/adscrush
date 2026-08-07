"use client"

import { TrendingUp } from "lucide-react"
import { PolarGrid, RadialBar, RadialBarChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@adscrush/ui/components/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@adscrush/ui/components/chart"

export interface BrowserDataPoint {
  browser: string
  clicks: number
}

interface BrowserRadialChartProps {
  data: BrowserDataPoint[]
}

const BROWSER_COLORS = {
  chrome: "var(--color-chrome)",
  safari: "var(--color-safari)",
  firefox: "var(--color-firefox)",
  edge: "var(--color-edge)",
  opera: "var(--color-opera)",
  brave: "var(--color-brave)",
  samsung: "var(--color-samsung)",
  other: "var(--color-other)",
} as const

const CHART_COLORS: Record<string, string> = {
  chrome: "hsl(217, 91%, 60%)",
  safari: "hsl(200, 80%, 50%)",
  firefox: "hsl(25, 95%, 53%)",
  edge: "hsl(160, 84%, 40%)",
  opera: "hsl(346, 77%, 50%)",
  brave: "hsl(280, 65%, 60%)",
  samsung: "hsl(199, 89%, 48%)",
  other: "hsl(215, 16%, 47%)",
}

export function BrowserRadialChart({ data }: BrowserRadialChartProps) {
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)

  if (data.length === 0) {
    return (
      <Card className="flex flex-col rounded-none border-0 bg-background shadow-none ring-0">
        <CardHeader className="items-center pb-0">
          <CardTitle>Clicks by Browser</CardTitle>
          <CardDescription>Browser distribution for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0 pt-6">
          <p className="text-sm text-muted-foreground">No browser data available</p>
        </CardContent>
      </Card>
    )
  }

  const normalizeKey = (browser: string) =>
    browser.toLowerCase().replace(/[^a-z0-9]/g, "-")

  const chartData = data.map((d) => {
    const key = normalizeKey(d.browser)
    const colorKey = CHART_COLORS[key] ? key : "other"
    return {
      browser: d.browser,
      name: key,
      clicks: d.clicks,
      fill: BROWSER_COLORS[colorKey as keyof typeof BROWSER_COLORS] ?? "var(--color-other)",
    }
  })

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d) => {
      const key = normalizeKey(d.browser)
      const colorKey = CHART_COLORS[key] ? key : "other"
      return [
        key,
        {
          label: d.browser,
          color: CHART_COLORS[colorKey] ?? CHART_COLORS.other,
        },
      ]
    }),
  )

  const topBrowser = data[0]
  const topShare = totalClicks > 0 && topBrowser ? ((topBrowser.clicks / totalClicks) * 100).toFixed(1) : "0"

  return (
    <Card className="flex flex-col rounded-none border-0 bg-background shadow-none ring-0">
      <CardHeader className="items-center pb-0">
        <CardTitle>Clicks by Browser</CardTitle>
        <CardDescription>Browser distribution for the selected period</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-none border border-border bg-background px-3 py-2 text-sm shadow-xl">
                    <div className="flex flex-col gap-1.5">
                      {payload.map((entry, i) => {
                        const d = entry.payload as { browser: string; fill: string }
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: d.fill }}
                            />
                            <span className="font-medium">{d.browser}</span>
                            <span className="font-mono tabular-nums text-muted-foreground">
                              {Number(entry.value ?? 0).toLocaleString()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="clicks" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          <TrendingUp className="h-4 w-4" />
          {topBrowser ? (
            <>
              {topBrowser.browser} leads with {topShare}% of {totalClicks.toLocaleString()} clicks
            </>
          ) : (
            <>No clicks recorded</>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          {data.length} browser{data.length !== 1 ? "s" : ""} detected
        </div>
      </CardFooter>
    </Card>
  )
}
