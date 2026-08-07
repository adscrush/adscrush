"use client"

import { TopBar } from "@/components/common/top-bar"
import { useNavigationGuard } from "@/features/products/hooks/use-navigation-guard"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { LanguageSelect } from "./language-select"
import { ProductSelect } from "@/components/product-select"
import { Switch } from "@adscrush/ui/components/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@adscrush/ui/components/tooltip"
import { toast } from "@adscrush/ui/sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconArrowLeft, IconInfoCircle, IconPlus, IconUpload, IconX } from "@tabler/icons-react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import Link from "next/link"
import * as React from "react"
import { createFunnelFormSchema, type CreateFunnelFormInput } from "../validations"
import { deriveName, parsePasteText } from "../lib/utils"

interface QueuedPage {
  id: string
  name: string
  url: string
}

interface FunnelCreateWizardProps {
  onSubmit: (
    data: CreateFunnelFormInput & {
      landingPages: Array<{ name?: string; url: string }>
    }
  ) => void | Promise<void>
}

export function FunnelCreateWizard({ onSubmit }: FunnelCreateWizardProps) {
  const [queuedPages, setQueuedPages] = React.useState<QueuedPage[]>([])
  const [pasteText, setPasteText] = React.useState("")
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [addName, setAddName] = React.useState("")
  const [addUrl, setAddUrl] = React.useState("")

  const form = useForm({
    resolver: zodResolver(createFunnelFormSchema),
    defaultValues: {
      productId: "",
      name: "",
      language: "en",
      domain: null,
      pageUrl: null,
      thankYouPageUrl: null,
      status: "active",
    },
  })

  const hasQueuedPages = queuedPages.length > 0
  const isFormDirty = form.formState.isDirty || hasQueuedPages
  useNavigationGuard(isFormDirty)

  const { handleSubmit, control, formState: { errors } } = form

  const handleInternalSubmit = async (data: CreateFunnelFormInput) => {
    await onSubmit({
      ...data,
      landingPages: queuedPages.map((p) => ({
        name: p.name,
        url: p.url,
      })),
    })
    form.reset()
    setQueuedPages([])
  }

  const handleParsePaste = () => {
    const pages = parsePasteText(pasteText)
    if (pages.length === 0) {
      toast.error("No valid URLs found")
      return
    }
    const existingIds = new Set(queuedPages.map((p) => p.url))
    const newPages: QueuedPage[] = pages
      .filter((p) => !existingIds.has(p.url))
      .map((p) => ({ id: crypto.randomUUID(), name: p.name, url: p.url }))
    if (newPages.length === 0) {
      toast.error("All URLs already added")
      return
    }
    setQueuedPages((prev) => [...prev, ...newPages])
    setPasteText("")
    toast.success(`${newPages.length} page${newPages.length > 1 ? "s" : ""} added`)
  }

  const handleAddSingle = () => {
    if (!addUrl) {
      toast.error("URL is required")
      return
    }
    try {
      new URL(addUrl)
    } catch {
      toast.error("Enter a valid URL")
      return
    }
    setQueuedPages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: addName || deriveName(addUrl), url: addUrl },
    ])
    setAddName("")
    setAddUrl("")
    setShowAddForm(false)
    toast.success("Landing page added")
  }

  const removePage = (id: string) => {
    setQueuedPages((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePageField = (id: string, field: "name" | "url", value: string) => {
    setQueuedPages((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleInternalSubmit)} className="flex flex-1 flex-col">
        <TopBar
          label="funnel"
          isDirty={isFormDirty}
          isSubmitting={form.formState.isSubmitting}
          onDiscard={() => { form.reset(); setQueuedPages([]) }}
        />

        <div className="flex items-center px-6 pt-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 text-xs text-muted-foreground">
            <Link href="/funnels">
              <IconArrowLeft className="mr-1 size-3.5" />
              Funnels
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 pt-3 lg:grid-cols-3">
          {/* Main content area (left column - 2/3 width) */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Product{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 align-text-bottom text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-60 text-xs">
                            The product this funnel routes traffic for.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <ProductSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search product..."
                      />
                      {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
                    </div>
                  )}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Funnel Name{" "}
                          <Tooltip>
                            <TooltipTrigger>
                              <IconInfoCircle className="inline size-3 align-text-bottom text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-60 text-xs">
                              A descriptive name to identify this funnel.
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          {...field}
                          placeholder="e.g. PowerPlus Tamil LP Set"
                          className={"text-sm" + (fieldState.invalid ? " border-destructive" : "")}
                        />
                        {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />

                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Language</Label>
                        <LanguageSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Landing Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Paste URLs</Label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={
                      "https://powerplus.ojasvati.shop/lp1/\nhttps://powerplus.ojasvati.shop/lp2/\nhttps://powerplus.ojasvati.shop/lp3/"
                    }
                    className="min-h-[72px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    rows={2}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      One per line. <code className="text-[10px]">offer url</code> or{" "}
                      <code className="text-[10px]">name | offer url</code>
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleParsePaste}
                      disabled={!pasteText.trim()}
                      className="h-7 px-2 text-[11px]"
                    >
                      <IconUpload className="mr-1 size-3" /> Add to list
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <IconPlus className="size-3" />
                    {showAddForm ? "Cancel" : "Add one"}
                  </button>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {showAddForm && (
                  <div className="flex items-start gap-2 rounded-md border bg-muted/20 p-2.5">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] font-medium">Name</Label>
                        <Input
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          placeholder="Landing Page"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex-[2] space-y-1">
                        <Label className="text-[11px] font-medium">URL</Label>
                        <Input
                          value={addUrl}
                          onChange={(e) => setAddUrl(e.target.value)}
                          placeholder="https://example.com/landing"
                          className="h-7 font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" onClick={handleAddSingle} className="h-7 px-2 text-[11px]">
                          <IconPlus className="mr-1 size-3" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {queuedPages.length > 0 ? (
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Name</th>
                          <th className="px-2.5 py-1.5 text-left font-medium text-muted-foreground">Offer URL</th>
                          <th className="w-8 px-2.5 py-1.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {queuedPages.map((p) => (
                          <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/20">
                            <td className="px-2.5 py-1">
                              <input
                                value={p.name}
                                onChange={(e) => updatePageField(p.id, "name", e.target.value)}
                                className="h-6 w-full rounded border border-input bg-background px-1.5 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-1">
                              <input
                                value={p.url}
                                onChange={(e) => updatePageField(p.id, "url", e.target.value)}
                                className="h-6 w-full rounded border border-input bg-background px-1.5 font-mono text-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                              />
                            </td>
                            <td className="px-2.5 py-1">
                              <button
                                type="button"
                                onClick={() => removePage(p.id)}
                                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                              >
                                <IconX className="size-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed py-8 text-center text-muted-foreground">
                    <IconUpload className="mx-auto mb-1.5 size-5 opacity-40" />
                    <p className="text-xs">No pages yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (right column - 1/3 width) */}
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <Switch
                        id="funnel-status"
                        checked={field.value === "active"}
                        onCheckedChange={(checked) => field.onChange(checked ? "active" : "inactive")}
                      />
                      <Label htmlFor="funnel-status" className="text-xs text-muted-foreground">
                        {field.value === "active" ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="domain"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Domain</Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="powerplus.ojasvati.shop"
                        className="text-sm"
                      />
                    </div>
                  )}
                />

                <Controller
                  name="pageUrl"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Page URL{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 align-text-bottom text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-60 text-xs">
                            The funnel page shown to the visitor (e.g. a product sample / pre-landing page). One per funnel.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="https://powerplus.ojasvati.shop/page"
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                />

                <Controller
                  name="thankYouPageUrl"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Thank You Page URL{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 align-text-bottom text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-60 text-xs">
                            Page shown after a user converts.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="https://powerplus.ojasvati.shop/thankyou"
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <input type="submit" className="hidden" />
      </form>
    </FormProvider>
  )
}
