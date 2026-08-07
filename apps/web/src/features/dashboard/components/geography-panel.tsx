"use client"

import { useState, useMemo } from "react"
import type { GeographyItem } from "../types"
import { Button } from "@adscrush/ui/components/button"
import { Badge } from "@adscrush/ui/components/badge"
import DottedMap from "dotted-map"
import { COUNTRIES } from "../countries"

interface GeographyPanelProps {
  geography: GeographyItem[]
}

interface HoveredCountryInfo {
  countryCode: string
  name: string
  clicks: number
  conversions: number
  x: number
  y: number
}

export function GeographyPanel({ geography }: GeographyPanelProps) {
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountryInfo | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")

  const mappedGeography = useMemo(() => {
    return geography
      .map((item) => {
        const countryData = COUNTRIES[item.countryCode.toUpperCase()]
        if (!countryData) return null
        return { ...item, name: countryData.name, lat: countryData.lat, lng: countryData.lng }
      })
      .filter((item): item is GeographyItem & { name: string } => item !== null)
  }, [geography])

  const mapSVG = useMemo(() => {
    const map = new DottedMap({ height: 30, grid: "diagonal" })
    return map.getPoints()
  }, [])

  const getCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) * 63) / 360
    const y = ((90 - lat) * 30) / 180
    return { x, y }
  }

  const totalClicks = mappedGeography.reduce((sum, item) => sum + item.clicks, 0)
  const totalConvs = mappedGeography.reduce((sum, item) => sum + item.conversions, 0)
  const totalActionCount = totalClicks + totalConvs

  const breakdown = [
    { label: "Click", value: totalActionCount > 0 ? (totalClicks / totalActionCount) * 100 : 0, color: "var(--primary)" },
    { label: "Conversion", value: totalActionCount > 0 ? (totalConvs / totalActionCount) * 100 : 0, color: "color-mix(in oklch, var(--primary) 55%, var(--background))" },
  ]

  return (
    <div className="relative flex h-full flex-col gap-4 bg-background p-4 sm:gap-5 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Geography</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {hoveredCountry ? hoveredCountry.clicks.toLocaleString() : totalClicks.toLocaleString()}
            </span>
            {hoveredCountry ? (
              <Badge variant="outline" className="h-6 gap-1.5 rounded-none border-muted/50 bg-muted/5 px-2 font-normal text-muted-foreground">
                <img src={`https://flagcdn.com/24x18/${hoveredCountry.countryCode.toLowerCase()}.png`} alt={hoveredCountry.name} className="h-3 w-4 rounded-[1px] object-cover" />
                <span className="text-xs">{hoveredCountry.name}</span>
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Clicks</span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-none px-2 text-xs"
          onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
        >
          {viewMode === "map" ? "Details" : "Map"}
        </Button>
      </div>

      {/* Action Breakdown Progress Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex h-1.5 w-full overflow-hidden rounded-none bg-muted/30">
          {breakdown.map((item, i) => (
            <div key={i} className="h-full transition-all duration-500 ease-out" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
          {breakdown.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-none" style={{ backgroundColor: item.color }} />
              {item.label} {item.value.toFixed(1)}%
            </span>
          ))}
        </div>
      </div>

      {/* Map or List View */}
      {viewMode === "map" ? (
        <div className="group relative mt-2 h-[200px]">
          <svg viewBox="0 0 63 30" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
            <defs>
              <style>{`
                @keyframes mapMarkerPulse {
                  0% { r: var(--pulse-r); opacity: 0.6; }
                  50% { r: var(--pulse-r-max); opacity: 0.15; }
                  100% { r: var(--pulse-r); opacity: 0.6; }
                }
                .map-marker { cursor: pointer; }
                .marker-pulse { animation: mapMarkerPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
              `}</style>
            </defs>
            {mapSVG.map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r={0.35} fill="currentColor" opacity="0.1" />
            ))}
            {mappedGeography.map((item, i) => {
              const { x, y } = getCoordinates(item.lat, item.lng)
              const radius = Math.max(1, Math.min(3, Math.log10(item.clicks + 1) * 2))
              return (
                <g key={i} className="map-marker"
                  onMouseEnter={() => setHoveredCountry({ countryCode: item.countryCode, name: item.name, clicks: item.clicks, conversions: item.conversions, x, y })}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  <circle cx={x} cy={y} r={radius * 1.5} fill="var(--primary)" className="marker-pulse" style={{ '--pulse-r': radius * 1.5, '--pulse-r-max': radius * 2.5 } as React.CSSProperties} />
                  <circle cx={x} cy={y} r={radius} fill="var(--primary)" fillOpacity="0.8" stroke="var(--background)" strokeWidth="0.3" />
                </g>
              )
            })}
          </svg>
          {hoveredCountry && (
            <div className="pointer-events-none absolute z-50 min-w-[160px] border border-border bg-background p-3 shadow-xl"
              style={{ left: `${(hoveredCountry.x / 63) * 100}%`, top: `${(hoveredCountry.y / 30) * 100}%`, transform: "translate(-50%, -110%)" }}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <img src={`https://flagcdn.com/24x18/${hoveredCountry.countryCode.toLowerCase()}.png`} alt={hoveredCountry.name} className="h-3.5 w-5 rounded-[1px] object-cover" />
                  <span className="text-sm font-bold tracking-tight uppercase">{hoveredCountry.name}</span>
                </div>
                <div className="font-mono text-2xl leading-none font-bold">{hoveredCountry.clicks.toLocaleString()}</div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Clicks</span>
                <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-none bg-muted/30">
                  <div className="h-full bg-primary" style={{ width: `${(hoveredCountry.clicks / (hoveredCountry.clicks + hoveredCountry.conversions || 1)) * 100}%` }} />
                  <div className="h-full bg-primary opacity-50" style={{ width: `${(hoveredCountry.conversions / (hoveredCountry.clicks + hoveredCountry.conversions || 1)) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-primary" />{hoveredCountry.clicks} Clicks</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-primary opacity-50" />{hoveredCountry.conversions} Conv</span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-border bg-background" />
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="mt-2 flex flex-col gap-1 overflow-y-auto">
          <div className="flex items-center gap-3 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="w-4" />
            <span className="w-4" />
            <span className="flex-1">Country</span>
            <span className="w-16 text-right">Clicks</span>
            <span className="w-12 text-right">Share</span>
            <span className="w-12" />
            <span className="w-10 text-right">CR</span>
          </div>
          {mappedGeography.sort((a, b) => b.clicks - a.clicks).map((item, i) => {
            const cr = item.clicks > 0 ? ((item.conversions / item.clicks) * 100).toFixed(1) : "0.0"
            const clickShare = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0
            return (
              <div key={item.countryCode} className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50">
                <span className="text-[10px] font-bold text-muted-foreground w-4 text-right tabular-nums">{i + 1}</span>
                <img src={`https://flagcdn.com/24x18/${item.countryCode.toLowerCase()}.png`} alt={item.name} className="h-3 w-4 rounded-[1px] object-cover" />
                <span className="flex-1 text-xs font-medium truncate">{item.name}</span>
                <span className="font-mono text-xs font-bold tabular-nums w-16 text-right">{item.clicks.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">{clickShare.toFixed(1)}%</span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted/30">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${clickShare}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{cr}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
