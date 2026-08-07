"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@adscrush/ui/components/sheet"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@adscrush/ui/components/select"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@adscrush/ui/components/accordion"
import { Filter, Settings2, SlidersHorizontal, Trash2 } from "lucide-react"
import { Label } from "@adscrush/ui/components/label"

import { Checkbox } from "@adscrush/ui/components/checkbox"
import { useQueryStates } from "nuqs"
import { performanceSearchParams } from "../validations"

export function FiltersSheet({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useQueryStates(performanceSearchParams, {
    shallow: false,
  })

  const handleReset = () => {
    setFilters(null)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[500px] p-0 flex flex-col rounded-none border-l border-muted/50">
        <SheetHeader className="p-6 border-b border-muted/30 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <SheetTitle className="text-sm font-bold uppercase tracking-widest leading-none">Filters & Columns</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-0 py-0 custom-scrollbar">
          <Accordion type="multiple" defaultValue={["filters", "columns"]} className="w-full">
            <AccordionItem value="filters" className="border-b border-muted/30 px-6">
              <AccordionTrigger className="hover:no-underline py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground group">
                 <div className="flex items-center gap-2">
                   <Filter className="size-3 group-data-[state=open]:text-primary" />
                   Filters
                 </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Product</Label>
                    <Input 
                      placeholder="Enter Product" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.productId ?? ""}
                      onChange={(e) => setFilters({ productId: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Advertiser</Label>
                    <Input 
                      placeholder="Enter Advertiser" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.advertiserId ?? ""}
                      onChange={(e) => setFilters({ advertiserId: e.target.value || null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Media Buyer</Label>
                    <Input 
                      placeholder="Enter Media Buyer" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.mediaBuyerId ?? ""}
                      onChange={(e) => setFilters({ mediaBuyerId: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Manager</Label>
                    <Select 
                      value={filters.managerId ?? ""} 
                      onValueChange={(v) => setFilters({ managerId: v || null })}
                    >
                      <SelectTrigger className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="emp1" className="text-xs rounded-none">Manager 1</SelectItem>
                        <SelectItem value="emp2" className="text-xs rounded-none">Manager 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Event</Label>
                    <Input 
                      placeholder="Enter Event" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.event ?? ""}
                      onChange={(e) => setFilters({ event: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Currency Convert</Label>
                    <Select 
                      value={filters.currency ?? ""} 
                      onValueChange={(v) => setFilters({ currency: v || null })}
                    >
                      <SelectTrigger className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="usd" className="text-xs rounded-none">USD</SelectItem>
                        <SelectItem value="inr" className="text-xs rounded-none">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Timezone</Label>
                    <Select 
                      value={filters.timezone ?? "GMT+5:30"} 
                      onValueChange={(v) => setFilters({ timezone: v })}
                    >
                      <SelectTrigger className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="GMT+5:30" className="text-xs rounded-none">(GMT +5:30) Bombay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Sub Offer</Label>
                    <Input 
                      placeholder="Enter Sub Offer" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.subOffer ?? ""}
                      onChange={(e) => setFilters({ subOffer: e.target.value || null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Log Type</Label>
                    <Select 
                      value={filters.logType ?? "all"} 
                      onValueChange={(v) => setFilters({ logType: v })}
                    >
                      <SelectTrigger className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="all" className="text-xs rounded-none">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Hour Filter</Label>
                    <Select 
                      value={filters.hour ?? ""} 
                      onValueChange={(v) => setFilters({ hour: v || null })}
                    >
                      <SelectTrigger className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="0" className="text-xs rounded-none">00:00 - 01:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                 <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground/60">Status</Label>
                    <Input 
                      placeholder="Enter Status" 
                      className="h-8 rounded-none text-xs bg-muted/5 border-muted/50 focus-visible:ring-primary/20" 
                      value={filters.status ?? ""}
                      onChange={(e) => setFilters({ status: e.target.value || null })}
                    />
                  </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="columns" className="border-b border-muted/30 px-6">
               <AccordionTrigger className="hover:no-underline py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground group">
                 <div className="flex items-center gap-2">
                   <Settings2 className="size-3 group-data-[state=open]:text-primary" />
                   Columns
                 </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 grid grid-cols-2 gap-y-3 gap-x-8">
                 {["OfferID", "Affiliate", "GrossClicks", "Conversions", "AdvertiserPrice", "AffiliatePayout", "Currency", "CR", "GeoCountry", "LandingPage", "Status"].map(col => (
                   <div key={col} className="flex items-center gap-2">
                     <Checkbox id={`col-${col}`} defaultChecked className="rounded-none border-muted-foreground/50 size-3.5" />
                     <label htmlFor={`col-${col}`} className="text-[11px] font-medium text-foreground cursor-pointer">{col}</label>
                   </div>
                 ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="p-4 border-t border-muted/30 bg-muted/5 mt-auto grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-none h-9 gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-black uppercase tracking-widest border-muted/50"
            onClick={handleReset}
          >
            <Trash2 className="size-3" />
            Reset
          </Button>
          <Button className="rounded-none h-9 gap-2 bg-primary/90 hover:bg-primary text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/10">
            Submit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
