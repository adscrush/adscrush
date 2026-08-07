"use client"

import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@adscrush/ui/components/combobox"
import { Label } from "@adscrush/ui/components/label"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { toast } from "@adscrush/ui/sonner"
import { IconLoader2, IconSelector } from "@tabler/icons-react"
import React, { useMemo } from "react"
import { useSettings, useUpdateSettings } from "@/features/settings/queries"
import currencySymbols from "currency-symbol-map/map"

function useTimezones() {
  return useMemo(() => {
    const raw = Intl.supportedValuesOf("timeZone")
    return raw
      .map((tz) => {
        const formatter = new Intl.DateTimeFormat("en", {
          timeZone: tz,
          timeZoneName: "shortOffset",
        })
        const parts = formatter.formatToParts(new Date())
        const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? ""
        const cleanOffset = offset === "GMT" ? "GMT+0" : offset
        const match = offset.match(/GMT([+-]?)(\d+)(?::(\d+))?/)
        const sign = match?.[1] === "-" ? -1 : 1
        const hours = Number.parseInt(match?.[2] || "0", 10)
        const minutes = Number.parseInt(match?.[3] || "0", 10)
        return {
          id: tz,
          label: `(${cleanOffset}) ${tz.replace(/_/g, " ")}`,
          numericOffset: sign * (hours * 60 + minutes),
        }
      })
      .sort((a, b) => a.numericOffset - b.numericOffset)
  }, [])
}

const currencyNames = new Intl.DisplayNames("en", { type: "currency" })

const CURRENCIES = Object.entries(currencySymbols)
  .filter(([code]) => {
    try {
      currencyNames.of(code)
      return true
    } catch {
      return false
    }
  })
  .map(([id, symbol]) => ({
    id,
    symbol: symbol as string,
    label: `${id} - ${currencyNames.of(id)}`,
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

const EXTERNAL_ROLES = [
  { value: "advertiser" as const, label: "Advertiser" },
  { value: "media_buyer" as const, label: "Media Buyer" },
]

export function SettingsClient() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const timezones = useTimezones()
  const [timezone, setTimezone] = React.useState("UTC")
  const [currency, setCurrency] = React.useState("USD")
  const [allowedRoles, setAllowedRoles] = React.useState<("advertiser" | "media_buyer")[]>([])

  React.useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone ?? "UTC")
      setCurrency(settings.currency ?? "USD")
      setAllowedRoles(
        settings.allowed_login_roles
          ? (settings.allowed_login_roles.split(",").filter(Boolean) as ("advertiser" | "media_buyer")[])
          : []
      )
    }
  }, [settings])

  const toggleRole = (role: "advertiser" | "media_buyer", checked: boolean) => {
    setAllowedRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)))
  }

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ timezone, currency, allowedLoginRoles: allowedRoles })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure application-wide preferences and defaults</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure application-wide preferences and defaults</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login Access</CardTitle>
          <CardDescription>Control which user types can login. Admin and Super Admin can always login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EXTERNAL_ROLES.map((role) => (
            <div key={role.value} className="flex items-center gap-3">
              <Checkbox
                id={`role-${role.value}`}
                checked={allowedRoles.includes(role.value)}
                onCheckedChange={(checked) => toggleRole(role.value, checked === true)}
              />
              <Label htmlFor={`role-${role.value}`} className="text-sm font-medium">
                {role.label}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Set the default timezone for reports and dates</CardDescription>
        </CardHeader>
        <CardContent>
          <Combobox
            autoHighlight
            items={timezones}
            value={timezones.find((t) => t.id === timezone) ?? null}
            itemToStringValue={(tz) => tz.label}
            onValueChange={(tz) => setTimezone(tz?.id ?? "UTC")}
          >
            <div className="flex flex-col gap-2">
              <ComboboxTrigger
                render={
                  <Button variant="outline" className="w-64 justify-between font-normal">
                    <span className="truncate">{timezones.find((t) => t.id === timezone)?.label ?? "UTC"}</span>
                    <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
                  </Button>
                }
              />
            </div>
            <ComboboxContent className="min-w-0">
              <div className="w-full p-1.5">
                <ComboboxInput
                  className="min-w-0 rounded-md"
                  placeholder="Search timezone..."
                  showTrigger={false}
                  showClear={false}
                />
              </div>
              <ComboboxEmpty>
                <span className="text-xs text-muted-foreground">No results found.</span>
              </ComboboxEmpty>
              <ComboboxList>
                {(tz) => (
                  <ComboboxItem key={tz.id} value={tz}>
                    <span className="truncate text-xs font-medium">{tz.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set the default currency for financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Combobox
            autoHighlight
            items={CURRENCIES}
            value={CURRENCIES.find((c) => c.id === currency) ?? null}
            itemToStringValue={(c) => c.label}
            onValueChange={(c) => setCurrency(c?.id ?? "USD")}
          >
            <div className="flex flex-col gap-2">
              <ComboboxTrigger
                render={
                  <Button variant="outline" className="w-64 justify-between font-normal">
                    <span className="truncate">
                      {(() => {
                        const c = CURRENCIES.find((c) => c.id === currency)
                        return c ? (
                          <>
                            <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 text-[11px] font-semibold">
                              {c.symbol}
                            </span>
                            {c.label}
                          </>
                        ) : (
                          "USD"
                        )
                      })()}
                    </span>
                    <IconSelector className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
                  </Button>
                }
              />
            </div>
            <ComboboxContent className="min-w-0">
              <div className="w-full p-1.5">
                <ComboboxInput
                  className="min-w-0 rounded-md"
                  placeholder="Search currency..."
                  showTrigger={false}
                  showClear={false}
                />
              </div>
              <ComboboxEmpty>
                <span className="text-xs text-muted-foreground">No results found.</span>
              </ComboboxEmpty>
              <ComboboxList>
                {(c) => (
                  <ComboboxItem key={c.id} value={c}>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 text-[11px] font-semibold">
                      {c.symbol}
                    </span>
                    <span className="ml-1.5 truncate text-xs font-medium">{c.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending && <IconLoader2 className="mr-2 size-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
