"use client"

import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@adscrush/ui/components/field"
import { Input } from "@adscrush/ui/components/input"
import { Switch } from "@adscrush/ui/components/switch"
import { Label } from "@adscrush/ui/components/label"
import { Textarea } from "@adscrush/ui/components/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react"
import { Controller, useForm } from "react-hook-form"
import { createCampaignFormSchema, type CreateCampaignFormInput } from "../validations"
import { CreativeSelector } from "./creative-selector"
import { FunnelCombobox } from "./funnel-combobox"
import { trpc } from "@/lib/trpc/client"

interface CampaignFormProps {
  /** Pre-populated funnel ID */
  funnelId?: string
  /** Display name for the pre-populated funnel */
  funnelName?: string
  /** Initial form data (for edit mode) */
  initialData?: Partial<CreateCampaignFormInput>
  /** Form submission handler */
  onSubmit: (data: CreateCampaignFormInput) => void | Promise<void>
  /** Whether the form is currently submitting */
  isPending: boolean
  /** Label for the submit button */
  submitLabel?: string
  /**
   * Portal (media buyer) variant — scopes the funnel picker to the buyer's
   * assigned products and omits creative selection.
   */
  portal?: boolean
}

/** Format a Date into the yyyy-mm-dd value expected by <input type="date">. */
function toDateInputValue(value: unknown): string {
  return value instanceof Date ? (value.toISOString().split("T")[0] ?? "") : ""
}

export function CampaignForm({
  funnelId: initialFunnelId,
  funnelName,
  initialData,
  onSubmit,
  isPending,
  submitLabel = "Create Campaign",
  portal,
}: CampaignFormProps) {
  const form = useForm({
    resolver: zodResolver(createCampaignFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      funnelId: initialFunnelId ?? initialData?.funnelId ?? "",
      creativeIds: initialData?.creativeIds ?? [],
      status: initialData?.status ?? "active",
      startDate: initialData?.startDate ?? null,
      endDate: initialData?.endDate ?? null,
      internalNotes: initialData?.internalNotes ?? "",
    },
  })

  // Resolve productId from selected funnel for creative selector
  const watchedFunnelId = form.watch("funnelId")

  const funnelDetail = trpc.funnels.byId.useQuery(
    { id: watchedFunnelId! },
    // Portal variant has no access to the internal funnel detail — the
    // creative selector is hidden anyway.
    { enabled: !!watchedFunnelId && !portal }
  )

  const productId = portal ? null : (funnelDetail.data?.productId ?? null)

  return (
    <form
      onSubmit={form.handleSubmit((data) => onSubmit(data as CreateCampaignFormInput))}
      className="w-full space-y-6"
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Campaign details */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Campaign details</CardTitle>
              <CardDescription>Name your campaign and link it to a funnel and creatives.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Campaign name */}
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="campaign-name">Campaign Name *</FieldLabel>
                      <Input
                        {...field}
                        id="campaign-name"
                        placeholder="Enter campaign name"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                {/* Funnel field */}
                <Controller
                  name="funnelId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="campaign-funnel">Funnel *</FieldLabel>
                      {initialFunnelId ? (
                        <Input id="campaign-funnel" value={funnelName ?? initialFunnelId} disabled readOnly />
                      ) : (
                        <FunnelCombobox
                          value={field.value || null}
                          onValueChange={(val) => field.onChange(val ?? "")}
                          portal={portal}
                        />
                      )}
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />

                {/* Creative Selector — hidden in the portal variant; buyers
                    manage creatives from their My Creatives page. */}
                {!portal && (
                  <Controller
                    name="creativeIds"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Creatives</FieldLabel>
                        <CreativeSelector
                          productId={productId}
                          value={field.value ?? []}
                          onValueChange={field.onChange}
                        />
                        <FieldDescription>
                          Select the creatives to run in this campaign, or upload a new one.
                        </FieldDescription>
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Internal notes</CardTitle>
              <CardDescription>Private notes for your team. Not shown to publishers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                name="internalNotes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="campaign-notes" className="sr-only">
                      Internal Notes
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="campaign-notes"
                      value={field.value ?? ""}
                      placeholder="Internal notes..."
                      className="min-h-[120px]"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Schedule & status */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Schedule &amp; status</CardTitle>
              <CardDescription>Control whether the campaign is live and when it runs.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Status toggle */}
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="campaign-status">Campaign Status</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="campaign-status"
                          checked={field.value === "active"}
                          onCheckedChange={(checked) => field.onChange(checked ? "active" : "paused")}
                        />
                        <Label htmlFor="campaign-status" className="text-sm text-muted-foreground">
                          {field.value === "active" ? "Active" : "Paused"}
                        </Label>
                      </div>
                    </Field>
                  )}
                />

                {/* Start date */}
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="campaign-start">Start Date</FieldLabel>
                      <Input
                        id="campaign-start"
                        type="date"
                        value={toDateInputValue(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </Field>
                  )}
                />

                {/* End date */}
                <Controller
                  name="endDate"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="campaign-end">End Date</FieldLabel>
                      <Input
                        id="campaign-end"
                        type="date"
                        value={toDateInputValue(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" className="gap-2" disabled={isPending}>
          {isPending ? (
            <>
              <IconLoader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {submitLabel} <IconDeviceFloppy className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
