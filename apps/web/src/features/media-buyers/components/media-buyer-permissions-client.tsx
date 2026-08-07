"use client"

import { ContentShell } from "@/components/common/content-shell"
import { useSession } from "@/lib/auth/client"
import { trpc } from "@/lib/trpc/client"
import {
  ALL_PERMISSION_ENTRIES,
  PERMISSION_PRESETS,
  PERMISSION_REGISTRY,
  type Permission,
} from "@adscrush/shared/constants/permissions"
import { ROLES } from "@adscrush/shared/constants/roles"
import { isAtLeastRole } from "@adscrush/shared/utils/roles"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@adscrush/ui/components/dialog"
import { Input } from "@adscrush/ui/components/input"
import { ScrollArea } from "@adscrush/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { Switch } from "@adscrush/ui/components/switch"
import { cn } from "@adscrush/ui/lib/utils"
import { toast } from "@adscrush/ui/sonner"
import { IconChevronLeft, IconLoader2, IconSearch, IconX } from "@tabler/icons-react"
import Link from "next/link"
import * as React from "react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildGateMap(entries: typeof ALL_PERMISSION_ENTRIES): Map<string, string> {
  const map = new Map<string, string>()
  for (const entry of entries) {
    if (entry.isGate) map.set(`${entry.module}.${entry.section}`, entry.key)
  }
  return map
}

const GATE_MAP = buildGateMap(ALL_PERMISSION_ENTRIES)

function getEffectivePermissions(selected: Set<Permission>): Permission[] {
  return ALL_PERMISSION_ENTRIES.filter((entry) => {
    if (!selected.has(entry.key as Permission)) return false
    if (entry.isGate) return true
    const gateKey = GATE_MAP.get(`${entry.module}.${entry.section}`)
    return gateKey ? selected.has(gateKey as Permission) : true
  }).map((e) => e.key as Permission)
}

function permissionsToSet(permissions: Permission[]): Set<Permission> {
  return new Set(permissions)
}

// ---------------------------------------------------------------------------
// Permission section
// ---------------------------------------------------------------------------

interface PermissionSectionProps {
  sectionName: string
  entries: typeof ALL_PERMISSION_ENTRIES
  selected: Set<Permission>
  onChange: (key: Permission, value: boolean) => void
  onSelectAll: (keys: Permission[], value: boolean) => void
}

function PermissionSection({ sectionName, entries, selected, onChange, onSelectAll }: PermissionSectionProps) {
  const gateEntry = entries.find((e) => e.isGate)
  const subEntries = entries.filter((e) => !e.isGate)
  const gridEntries = entries

  const gateOn = gateEntry ? selected.has(gateEntry.key as Permission) : true
  const allSubOn = gridEntries.length > 0 && gridEntries.every((e) => selected.has(e.key as Permission))

  function handleGateChange(checked: boolean) {
    if (!gateEntry) return
    if (checked) {
      onChange(gateEntry.key as Permission, true)
    } else {
      const allKeys = [gateEntry.key as Permission, ...subEntries.map((e) => e.key as Permission)]
      onSelectAll(allKeys, false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <label className="text-sm font-semibold capitalize">
          {sectionName.replace(/_/g, " ")}
        </label>
        {gridEntries.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectAll(gridEntries.map((e) => e.key as Permission), !allSubOn)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSubOn ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>
      {gridEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pl-1 lg:grid-cols-3">
          {gridEntries.map((entry) => (
            <label
              key={entry.key}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <Switch
                checked={selected.has(entry.key as Permission)}
                onCheckedChange={(checked) => {
                  if (entry.isGate) {
                    handleGateChange(checked)
                  } else {
                    onChange(entry.key as Permission, checked)
                  }
                }}
                disabled={!entry.isGate && !gateOn}
                className={cn("scale-90 shrink-0", !entry.isGate && !gateOn && "opacity-40")}
              />
              <span className={cn("leading-tight", !entry.isGate && !gateOn && "opacity-40")}>
                {entry.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module sidebar item
// ---------------------------------------------------------------------------

interface ModuleSidebarItemProps {
  moduleName: string
  isActive: boolean
  selectedCount: number
  totalCount: number
  onClick: () => void
}

function ModuleSidebarItem({ moduleName, isActive, selectedCount, totalCount, onClick }: ModuleSidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors text-left",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground",
      )}
    >
      <span className="capitalize font-medium">{moduleName.replace(/_/g, " ")}</span>
      <span className={cn(
        "text-xs tabular-nums",
        isActive ? "text-primary-foreground/70" : "text-muted-foreground",
      )}>
        {selectedCount}/{totalCount}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MediaBuyerPermissionsClientProps {
  mediaBuyerId: string
}

export function MediaBuyerPermissionsClient({ mediaBuyerId }: MediaBuyerPermissionsClientProps) {
  const { data: session } = useSession()
  const user = session?.user

  const { data: buyer } = trpc.mediaBuyers.byId.useQuery({ id: mediaBuyerId })

  const permissionsQuery = trpc.mediaBuyers.getPermissions.useQuery(
    { mediaBuyerId },
    { staleTime: 0 },
  )

  const updateMutation = trpc.mediaBuyers.updatePermissions.useMutation()
  const applyPresetMutation = trpc.mediaBuyers.applyPreset.useMutation()
  const utils = trpc.useUtils()

  // Media buyers cannot have employee-related permissions — hide the module
  const REGISTRY_MODULES = React.useMemo(
    () => Object.keys(PERMISSION_REGISTRY).filter((m) => m !== "employees"),
    [],
  )

  const [activeModule, setActiveModule] = React.useState<string>(
    REGISTRY_MODULES[0] ?? "",
  )

  const [selected, setSelected] = React.useState<Set<Permission>>(new Set())
  const hasInitializedRef = React.useRef(false)

  React.useEffect(() => {
    if (permissionsQuery.data !== undefined && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setSelected(permissionsToSet(permissionsQuery.data as Permission[]))
    }
  }, [permissionsQuery.data])

  const toggle = React.useCallback((key: Permission, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (value) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const toggleAll = React.useCallback((keys: Permission[], value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const key of keys) {
        if (value) next.add(key)
        else next.delete(key)
      }
      return next
    })
  }, [])

  // Per-module counts for sidebar badges
  const moduleCountMap = React.useMemo(() => {
    const map: Record<string, { selected: number; total: number }> = {}
    for (const [moduleName, sections] of Object.entries(PERMISSION_REGISTRY)) {
      let total = 0
      let count = 0
      for (const entries of Object.values(sections)) {
        for (const entry of entries as typeof ALL_PERMISSION_ENTRIES) {
          total++
          if (selected.has(entry.key as Permission)) count++
        }
      }
      map[moduleName] = { selected: count, total }
    }
    return map
  }, [selected])

  // Search state & filtered results
  const [searchQuery, setSearchQuery] = React.useState("")
  const isSearching = searchQuery.length > 0

  const filteredResults = React.useMemo(() => {
    if (!isSearching) return null

    const q = searchQuery.toLowerCase().trim()
    const result: Record<string, Record<string, typeof ALL_PERMISSION_ENTRIES>> = {}

    for (const entry of ALL_PERMISSION_ENTRIES) {
      // Media buyers cannot have employee permissions — skip entirely
      if (entry.module === "employees") continue

      const matchesLabel = entry.label.toLowerCase().includes(q)
      const matchesModule = entry.module.toLowerCase().includes(q)
      const matchesSection = entry.section.toLowerCase().includes(q)
      if (!matchesLabel && !matchesModule && !matchesSection) continue

      const mod = entry.module
      const sec = entry.section
      if (!result[mod]) result[mod] = {}
      if (!result[mod][sec]) result[mod][sec] = []
      result[mod][sec].push(entry)
    }

    return result
  }, [searchQuery, isSearching])

  const searchModuleCounts = React.useMemo(() => {
    if (!isSearching || !filteredResults) return {}
    const counts: Record<string, number> = {}
    for (const [mod, sections] of Object.entries(filteredResults)) {
      let total = 0
      for (const entries of Object.values(sections)) {
        total += entries.length
      }
      counts[mod] = total
    }
    return counts
  }, [isSearching, filteredResults])

  const modulesWithResults = React.useMemo(() => {
    if (!isSearching || !filteredResults) return []
    return Object.keys(filteredResults)
  }, [isSearching, filteredResults])

  const sidebarModules = isSearching
    ? modulesWithResults
    : REGISTRY_MODULES

  const displayResults = isSearching && filteredResults && activeModule && filteredResults[activeModule]
    ? { [activeModule]: filteredResults[activeModule] }
    : filteredResults

  // Confirm dialog state (must be before early returns to keep hooks consistent)
  type PendingAction =
    | { type: "save"; permissions: Permission[] }
    | { type: "preset"; preset: string; permissions: Permission[] }

  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null)

  // Guards
  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (!isAtLeastRole(user.role, ROLES.ADMIN)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg font-semibold">Unauthorized</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage media buyer permissions.
        </p>
      </div>
    )
  }

  function handlePresetChange(preset: string) {
    if (preset === "custom") return
    const presetPermissions = PERMISSION_PRESETS[preset] ?? []
    setPendingAction({ type: "preset", preset, permissions: presetPermissions })
  }

  function handleSaveClick() {
    const effective = getEffectivePermissions(selected)
    setPendingAction({ type: "save", permissions: effective })
  }

  async function handleConfirm() {
    if (!pendingAction) return
    try {
      if (pendingAction.type === "save") {
        await updateMutation.mutateAsync({ mediaBuyerId, permissions: pendingAction.permissions })
        toast.success("Permissions saved")
      } else if (pendingAction.type === "preset") {
        await applyPresetMutation.mutateAsync({
          mediaBuyerId,
          preset: pendingAction.preset as "full" | "manager" | "readonly",
        })
        hasInitializedRef.current = false
        await utils.mediaBuyers.getPermissions.invalidate({ mediaBuyerId })
        const fresh = await utils.mediaBuyers.getPermissions.fetch({ mediaBuyerId })
        setSelected(permissionsToSet(fresh as Permission[]))
        hasInitializedRef.current = true
        toast.success(`Applied "${pendingAction.preset}" preset`)
      }
      setPendingAction(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed")
    }
  }

  function getConfirmDescription(action: PendingAction): string {
    const count = action.permissions.length
    const countStr = `${count} permission${count !== 1 ? "s" : ""}`
    if (action.type === "save") {
      return `You are about to apply ${countStr} to this media buyer. This will replace their current permission set.`
    }
    return `Applying the "${action.preset}" preset will replace the current permissions with ${countStr}.`
  }

  const activeSections = activeModule
    ? (PERMISSION_REGISTRY[activeModule as keyof typeof PERMISSION_REGISTRY] ?? {})
    : {}
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN
  const selectedCount = selected.size

  return (
    <ContentShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/media-buyers/${mediaBuyerId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <IconChevronLeft className="size-4" />
          {buyer?.name ?? "Media Buyer"}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Permissions</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Permissions</h1>
          <Badge variant="secondary">{selectedCount} Selected</Badge>
        </div>

        {!isSuperAdmin && (
          <div className="flex items-center gap-2">
            <Select
              onValueChange={handlePresetChange}
              disabled={applyPresetMutation.isPending}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Apply preset…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="readonly">Readonly</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
            {applyPresetMutation.isPending && (
              <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          As a Super Admin, your access is unconditional and not governed by the permission system.
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search permissions by name, module, or section…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {isSearching && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX className="size-4" />
          </button>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 rounded-lg border border-border bg-card">
        <div className="w-48 shrink-0 border-r border-border p-3">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-1 pr-2">
              {isSearching && modulesWithResults.length > 0 && (
                <ModuleSidebarItem
                  moduleName="All"
                  isActive={activeModule === ""}
                  selectedCount={Object.values(searchModuleCounts).reduce((a, b) => a + b, 0)}
                  totalCount={Object.values(searchModuleCounts).reduce((a, b) => a + b, 0)}
                  onClick={() => setActiveModule("")}
                />
              )}
              {sidebarModules.map((moduleName) => {
                const counts = isSearching
                  ? { selected: searchModuleCounts[moduleName] ?? 0, total: searchModuleCounts[moduleName] ?? 0 }
                  : moduleCountMap[moduleName] ?? { selected: 0, total: 0 }
                return (
                  <ModuleSidebarItem
                    key={moduleName}
                    moduleName={moduleName}
                    isActive={activeModule === moduleName}
                    selectedCount={counts.selected}
                    totalCount={counts.total}
                    onClick={() => setActiveModule(moduleName)}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 min-w-0 p-5">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {isSearching ? (
              displayResults && Object.keys(displayResults).length > 0 ? (
                <div className="space-y-6 pr-2">
                  {Object.entries(displayResults).map(([moduleName, sections]) => (
                    <div key={moduleName} className="space-y-4">
                      <h2 className="text-base font-semibold capitalize">
                        {moduleName.replace(/_/g, " ")}
                      </h2>
                      {Object.entries(sections).map(([sectionName, entries]) => (
                        <PermissionSection
                          key={`${moduleName}.${sectionName}`}
                          sectionName={sectionName}
                          entries={entries}
                          selected={selected}
                          onChange={toggle}
                          onSelectAll={toggleAll}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <IconSearch className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No permissions match your search</p>
                </div>
              )
            ) : (
              <div className="space-y-6 pr-2">
                <h2 className="text-base font-semibold capitalize">
                  {activeModule.replace(/_/g, " ")}
                </h2>
                {Object.entries(activeSections).map(([sectionName, entries]) => (
                  <PermissionSection
                    key={sectionName}
                    sectionName={sectionName}
                    entries={entries as typeof ALL_PERMISSION_ENTRIES}
                    selected={selected}
                    onChange={toggle}
                    onSelectAll={toggleAll}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Changes will take effect within 5 minutes.
        </p>
        <Button onClick={handleSaveClick} disabled={updateMutation.isPending} size="sm">
          {updateMutation.isPending && (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          )}
          Save Permissions
        </Button>
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(open) => { if (!open) setPendingAction(null) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "save" && "Save Permissions"}
              {pendingAction?.type === "preset" && "Apply Preset"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction && getConfirmDescription(pendingAction)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={updateMutation.isPending || applyPresetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={updateMutation.isPending || applyPresetMutation.isPending}
            >
              {(updateMutation.isPending || applyPresetMutation.isPending) && (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentShell>
  )
}
