"use client"

import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Checkbox } from "@adscrush/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@adscrush/ui/components/dialog"
import { Field, FieldContent, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adscrush/ui/components/select"
import { toast } from "@adscrush/ui/sonner"
import {
  IconCirclePlus,
  IconEdit,
  IconLink,
  IconUpload,
  IconTrash,
  IconWeight,
  IconCheck,
  IconX,
  IconBraces,
  IconCopy,
} from "@tabler/icons-react"
import { URL_TOKENS } from "@adscrush/shared/constants/tokens"
import * as React from "react"
import { useAddLandingPage, useDeleteLandingPage, useUpdateLandingPage } from "../queries"
import type { FunnelDetail } from "../queries"
import { BulkLandingPageImport } from "./bulk-landing-page-import"

interface FunnelLandingPagesProps {
  funnel: FunnelDetail
}

interface LPFormData {
  name: string
  url: string
  weight: number | null | undefined
  status: "active" | "inactive"
}

const emptyForm: LPFormData = {
  name: "",
  url: "",
  weight: undefined,
  status: "active",
}

export function FunnelLandingPages({ funnel }: FunnelLandingPagesProps) {
  const funnelId = funnel.id
  const [addOpen, setAddOpen] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<LPFormData>(emptyForm)
  const [inlineEditUrl, setInlineEditUrl] = React.useState<string>("")
  const [showInlineTokens, setShowInlineTokens] = React.useState(false)
  const inlineInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isAllSelected, setIsAllSelected] = React.useState(false)

  const addMutation = useAddLandingPage()
  const updateMutation = useUpdateLandingPage()
  const deleteMutation = useDeleteLandingPage()

  const landingPages = funnel.landingPages ?? []

  const handleAdd = () => {
    if (!form.url) {
      toast.error("URL is required")
      return
    }
    addMutation.mutate(
      {
        funnelId,
        name: form.name || "Landing Page",
        url: form.url,
        weight: form.weight,
      },
      {
        onSuccess: () => {
          toast.success("Landing page added")
          setForm(emptyForm)
          setAddOpen(false)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleUpdate = (id: string, updates: Partial<LPFormData>) => {
    updateMutation.mutate(
      {
        id,
        ...updates,
      },
      {
        onSuccess: () => {
          toast.success("Landing page updated")
          setEditingId(null)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Landing page deleted")
          setDeleteId(null)
        },
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const startInlineEdit = (lp: (typeof landingPages)[number]) => {
    setEditingId(lp.id)
    setInlineEditUrl(lp.url)
    setShowInlineTokens(false)
  }

  const saveInlineEdit = (lp: (typeof landingPages)[number]) => {
    if (inlineEditUrl !== lp.url) {
      handleUpdate(lp.id, { url: inlineEditUrl })
    }
    setEditingId(null)
    setInlineEditUrl("")
    setShowInlineTokens(false)
  }

  const cancelInlineEdit = () => {
    setEditingId(null)
    setInlineEditUrl("")
    setShowInlineTokens(false)
  }

  const insertInlineToken = (token: string) => {
    const input = inlineInputRef.current
    if (!input) return

    const start = input.selectionStart ?? inlineEditUrl.length
    const end = input.selectionEnd ?? inlineEditUrl.length
    const newUrl = inlineEditUrl.substring(0, start) + token + inlineEditUrl.substring(end)

    setInlineEditUrl(newUrl)

    // Set cursor position after inserted token
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard")
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
    setIsAllSelected(newSelection.size === landingPages.length)
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
      setIsAllSelected(false)
    } else {
      setSelectedIds(new Set(landingPages.map((lp) => lp.id)))
      setIsAllSelected(true)
    }
  }

  const bulkUpdateStatus = (status: "active" | "inactive") => {
    if (selectedIds.size === 0) {
      toast.error("No landing pages selected")
      return
    }

    Promise.all(
      Array.from(selectedIds).map((id) =>
        updateMutation.mutateAsync({ id, status })
      )
    )
      .then(() => {
        toast.success(`${selectedIds.size} landing pages updated to ${status}`)
        setSelectedIds(new Set())
        setIsAllSelected(false)
      })
      .catch((e) => toast.error(e.message))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconLink className="size-5" /> Landing Pages
        </CardTitle>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => bulkUpdateStatus("active")}
                disabled={updateMutation.isPending}
              >
                <IconCheck className="size-3.5" /> Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => bulkUpdateStatus("inactive")}
                disabled={updateMutation.isPending}
              >
                <IconX className="size-3.5" /> Disable
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setBulkOpen(true)}
          >
            <IconUpload className="size-3.5" /> Bulk Import
          </Button>
          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open)
              if (open) setForm(emptyForm)
            }}
          >
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5 text-xs">
                  <IconCirclePlus className="size-3.5" /> Add Landing Page
                </Button>
              }
            />
            <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
              <div className="flex flex-col h-full max-h-[85vh]">
                <DialogHeader className="px-4 pt-4 pb-3 shrink-0">
                  <DialogTitle>Add Landing Page</DialogTitle>
                  <DialogDescription>Add a new landing page variant for this funnel.</DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 px-4 pb-3">
                  <LandingPageForm form={form} onChange={setForm} />
                </div>
                <DialogFooter className="shrink-0 px-4 pb-4 pt-4 -mx-0 -mb-0">
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
                    {addMutation.isPending ? "Adding..." : "Add Landing Page"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {landingPages.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground mx-6 mb-6">
            <IconLink className="mx-auto mb-3 size-12 opacity-20" />
            <p className="text-sm font-medium">No landing pages yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add landing page variants for A/B testing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">URL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Weight</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {landingPages.map((lp) => (
                  <tr key={lp.id} className="hover:bg-muted/20 transition-colors">
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(lp.id)}
                        onCheckedChange={() => toggleSelection(lp.id)}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      {lp.name}
                    </td>

                    {/* URL - Inline Editable */}
                    <td className="px-4 py-3 max-w-md">
                      {editingId === lp.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              ref={inlineInputRef}
                              value={inlineEditUrl}
                              onChange={(e) => setInlineEditUrl(e.target.value)}
                              className="h-7 text-xs font-mono flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveInlineEdit(lp)
                                if (e.key === "Escape") cancelInlineEdit()
                              }}
                            />
                            <Button
                              size="icon-sm"
                              variant="outline"
                              className="size-7 shrink-0"
                              onClick={() => setShowInlineTokens(!showInlineTokens)}
                              title="Insert Token"
                            >
                              <IconBraces className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              className="size-7 shrink-0"
                              onClick={() => saveInlineEdit(lp)}
                              disabled={updateMutation.isPending}
                            >
                              <IconCheck className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="size-7 shrink-0"
                              onClick={cancelInlineEdit}
                            >
                              <IconX className="size-3.5" />
                            </Button>
                          </div>
                          {showInlineTokens && (
                            <div className="rounded-lg border bg-card shadow-lg">
                              <div className="p-3 border-b bg-muted/50">
                                <p className="text-xs font-semibold">Available Tokens</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Click token to insert at cursor position</p>
                              </div>
                              <div className="p-3 max-h-[300px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                  {URL_TOKENS.map((token) => (
                                    <button
                                      key={token.value}
                                      type="button"
                                      onClick={() => insertInlineToken(token.value)}
                                      className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left group"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-medium text-foreground">{token.label}</div>
                                        <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                                          {getTokenDescription(token.value)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <code className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded whitespace-nowrap">
                                          {token.value}
                                        </code>
                                        <Button
                                          type="button"
                                          size="icon-sm"
                                          variant="ghost"
                                          className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            navigator.clipboard.writeText(token.value)
                                            toast.success(`Copied ${token.value}`)
                                          }}
                                        >
                                          <IconCopy className="size-3" />
                                        </Button>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="p-3 border-t bg-muted/50">
                                <div className="flex items-start gap-2 text-xs">
                                  <IconCheck className="size-3.5 text-green-600 shrink-0 mt-0.5" />
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">clickid</span> parameter is automatically added to all URLs
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          onDoubleClick={() => startInlineEdit(lp)}
                          title="Double-click to edit"
                        >
                          <code className="text-xs text-muted-foreground truncate block flex-1">
                            {lp.url}
                          </code>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyUrl(lp.url)
                            }}
                          >
                            <IconCopy className="size-3" />
                          </Button>
                        </div>
                      )}
                    </td>

                    {/* Weight */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <IconWeight className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {lp.weight === null || lp.weight === undefined ? (
                            <span className="text-muted-foreground">Auto</span>
                          ) : lp.weight === 0 ? (
                            <span className="text-muted-foreground line-through">Disabled</span>
                          ) : (
                            lp.weight
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={lp.status === "active" ? "default" : "secondary"}
                        className="text-[10px] font-medium"
                      >
                        {lp.status === "active" ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <EditLandingPageDialog
                          landingPage={lp}
                          onSave={(updates) => handleUpdate(lp.id, updates)}
                          isLoading={updateMutation.isPending}
                        />
                        <Dialog open={deleteId === lp.id} onOpenChange={(o) => !o && setDeleteId(null)}>
                          <DialogTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteId(lp.id)}
                              >
                                <IconTrash className="size-3.5" />
                              </Button>
                            }
                          />
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Landing Page</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete &quot;{lp.name}&quot;? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(lp.id)}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Landing Pages</DialogTitle>
            <DialogDescription>Import multiple landing pages at once</DialogDescription>
          </DialogHeader>
          <BulkLandingPageImport funnelId={funnelId} onComplete={() => setBulkOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function LandingPageForm({
  form,
  onChange,
}: {
  form: LPFormData
  onChange: (f: LPFormData) => void
}) {
  const urlInputRef = React.useRef<HTMLInputElement>(null)
  const [showTokens, setShowTokens] = React.useState(false)

  const insertToken = (token: string) => {
    const input = urlInputRef.current
    if (!input) return

    const start = input.selectionStart ?? form.url.length
    const end = input.selectionEnd ?? form.url.length
    const newUrl = form.url.substring(0, start) + token + form.url.substring(end)

    onChange({ ...form, url: newUrl })

    // Set cursor position after inserted token
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <Field orientation="vertical" className="flex flex-col gap-1.5">
        <FieldLabel className="text-xs font-medium">Name</FieldLabel>
        <FieldContent>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g., LP17, Main Landing Page"
            className="h-9 text-sm"
          />
        </FieldContent>
      </Field>

      <Field orientation="vertical" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel className="text-xs font-medium">Landing Page URL *</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setShowTokens(!showTokens)}
          >
            <IconBraces className="size-3.5" />
            {showTokens ? "Hide Tokens" : "Insert Token"}
          </Button>
        </div>
        <FieldContent>
          <Input
            ref={urlInputRef}
            value={form.url}
            onChange={(e) => onChange({ ...form, url: e.target.value })}
            placeholder="https://example.com/landing"
            className="h-9 text-sm font-mono"
          />
        </FieldContent>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Example: <code className="bg-muted px-1 rounded">https://example.com/lp?source={"{source}"}&mb={"{media_buyer_id}"}</code>
        </p>

        {/* Collapsible Token List */}
        {showTokens && (
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <div className="p-3 border-b bg-muted/50">
              <h4 className="font-semibold text-sm">Available Tokens</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click token to insert at cursor position
              </p>
            </div>
            <div className="p-3 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {URL_TOKENS.map((token) => (
                  <button
                    key={token.value}
                    type="button"
                    onClick={() => insertToken(token.value)}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{token.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {getTokenDescription(token.value)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">
                        {token.value}
                      </code>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(token.value)
                          toast.success(`Copied ${token.value}`)
                        }}
                      >
                        <IconCopy className="size-3" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 border-t bg-muted/50">
              <div className="flex items-start gap-2 text-xs">
                <IconCheck className="size-3.5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">clickid</span> parameter is automatically added to all URLs
                </div>
              </div>
            </div>
          </div>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field orientation="vertical" className="flex flex-col gap-1.5">
          <FieldLabel className="text-xs font-medium">Weight</FieldLabel>
          <FieldContent>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.weight ?? ""}
              onChange={(e) => {
                const value = e.target.value
                onChange({
                  ...form,
                  weight: value === "" ? null : Number(value)
                })
              }}
              placeholder="Auto"
              className="h-9 text-sm"
            />
          </FieldContent>
          <p className="text-[10px] text-muted-foreground">
            Empty = Auto distribution, 0 = Disabled, 1-100 = Weight %
          </p>
        </Field>
        <Field orientation="vertical" className="flex flex-col gap-1.5">
          <FieldLabel className="text-xs font-medium">Status</FieldLabel>
          <FieldContent>
            <Select value={form.status} onValueChange={(v) => onChange({ ...form, status: v as "active" | "inactive" })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Enabled</SelectItem>
                <SelectItem value="inactive">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>
    </div>
  )
}

function EditLandingPageDialog({
  landingPage,
  onSave,
  isLoading,
}: {
  landingPage: { id: string; name: string; url: string; weight: number | null; status: string }
  onSave: (updates: Partial<LPFormData>) => void
  isLoading: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<LPFormData>({
    name: landingPage.name,
    url: landingPage.url,
    weight: landingPage.weight ?? undefined,
    status: landingPage.status as "active" | "inactive",
  })

  React.useEffect(() => {
    if (open) {
      setForm({
        name: landingPage.name,
        url: landingPage.url,
        weight: landingPage.weight ?? undefined,
        status: landingPage.status as "active" | "inactive",
      })
    }
  }, [open, landingPage])

  const handleSave = () => {
    onSave(form)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} size="xl">
      <DialogTrigger render={
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7"
        >
          <IconEdit className="size-3.5" />
        </Button>
      } />
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader className="px-4 pt-4 pb-3 shrink-0">
            <DialogTitle>Edit Landing Page</DialogTitle>
            <DialogDescription>Update landing page configuration</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-4 pb-3">
            <LandingPageForm form={form} onChange={setForm} />
          </div>
          <DialogFooter className="shrink-0 px-4 pb-4 pt-4 -mx-0 -mb-0">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getTokenDescription(token: string): string {
  const descriptions: Record<string, string> = {
    "{tid}": "Unique transaction/click ID (UUID)",
    "{campaign_id}": "Campaign identifier",
    "{ad_account_id}": "Ad account identifier",
    "{media_buyer_id}": "Media buyer who sent the traffic",
    "{adv_id}": "Advertiser identifier",
    "{product_id}": "Product being promoted",
    "{funnel_id}": "Funnel identifier",
    "{creative_id}": "Creative/ad identifier",
    "{source}": "Traffic source (e.g., facebook, google)",
    "{sub1}": "Custom sub parameter 1",
    "{sub2}": "Custom sub parameter 2",
    "{sub3}": "Custom sub parameter 3",
  }
  return descriptions[token] || "Custom token"
}
