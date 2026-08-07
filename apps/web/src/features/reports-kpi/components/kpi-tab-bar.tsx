"use client"

import { Tabs, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"

type GroupByValue =
  | "campaign"
  | "product"
  | "advertiser"
  | "mediaBuyer"
  | "adAccount"

interface KpiTabBarProps {
  activeTab: GroupByValue
  onTabChange: (tab: GroupByValue) => void
  disabled?: boolean
}

const TAB_CONFIG: { label: string; value: GroupByValue }[] = [
  { label: "Campaigns", value: "campaign" },
  { label: "Products", value: "product" },
  { label: "Advertisers", value: "advertiser" },
  { label: "Media Buyers", value: "mediaBuyer" },
  { label: "Ad Accounts", value: "adAccount" },
]

export function KpiTabBar({ activeTab, onTabChange, disabled }: KpiTabBarProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as GroupByValue)}
    >
      <TabsList className="h-9 rounded-none border-b border-border bg-transparent p-0">
        {TAB_CONFIG.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={disabled}
            className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-bold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
