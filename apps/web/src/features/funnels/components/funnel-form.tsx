"use client"

import { TopBar } from "@/components/common/top-bar"
import { useNavigationGuard } from "@/features/products/hooks/use-navigation-guard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@adscrush/ui/components/card"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { LanguageSelect } from "./language-select"
import { ProductSelect } from "@/components/product-select"
import { Switch } from "@adscrush/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@adscrush/ui/components/tooltip"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconInfoCircle } from "@tabler/icons-react"
import * as React from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import {
  createFunnelFormSchema,
  type CreateFunnelFormInput,
} from "../validations"

interface FunnelFormProps {
  initialData?: Partial<CreateFunnelFormInput>
  onSubmit: (data: CreateFunnelFormInput) => void | Promise<void>
  isPending: boolean
}

export function FunnelForm({
  initialData,
  onSubmit,
  isPending,
}: FunnelFormProps) {
  const form = useForm({
    resolver: zodResolver(createFunnelFormSchema),
    defaultValues: {
      productId: initialData?.productId ?? "",
      name: initialData?.name ?? "",
      language: initialData?.language ?? "en",
      domain: initialData?.domain ?? null,
      pageUrl: initialData?.pageUrl ?? null,
      thankYouPageUrl: initialData?.thankYouPageUrl ?? null,
      status: initialData?.status ?? "active",
    },
  })

  useNavigationGuard(form.formState.isDirty)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form

  const handleInternalSubmit = async (data: CreateFunnelFormInput) => {
    await onSubmit(data)
    form.reset(data)
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleInternalSubmit)} className="flex flex-1 flex-col">
        <TopBar label="funnel" isDirty={form.formState.isDirty} isSubmitting={isPending} onDiscard={() => form.reset()} />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Main content area (left column - 2/3 width) */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product */}
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Product{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 text-muted-foreground align-text-bottom" />
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
                      {errors.productId && (
                        <p className="text-xs text-destructive">
                          {errors.productId.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Funnel Name + Language inline */}
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
                              <IconInfoCircle className="inline size-3 text-muted-foreground align-text-bottom" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-60 text-xs">
                              A descriptive name to identify this funnel.
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          {...field}
                          placeholder="e.g. PowerPlus Tamil LP Set"
                          className={
                            "text-sm" +
                            (fieldState.invalid ? " border-destructive" : "")
                          }
                        />
                        {fieldState.error && (
                          <p className="text-xs text-destructive">
                            {fieldState.error.message}
                          </p>
                        )}
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
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "active" : "inactive")
                        }
                      />
                      <Label
                        htmlFor="funnel-status"
                        className="text-xs text-muted-foreground"
                      >
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
                {/* Domain */}
                <Controller
                  name="domain"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Domain</Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                        placeholder="powerplus.ojasvati.shop"
                        className="text-sm"
                      />
                    </div>
                  )}
                />

                {/* Page URL */}
                <Controller
                  name="pageUrl"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Page URL{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 text-muted-foreground align-text-bottom" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-60 text-xs">
                            The funnel page shown to the visitor (e.g. a product sample / pre-landing page). One per funnel.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                        placeholder="https://powerplus.ojasvati.shop/page"
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                />

                {/* Thank You Page URL */}
                <Controller
                  name="thankYouPageUrl"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Thank You Page URL{" "}
                        <Tooltip>
                          <TooltipTrigger>
                            <IconInfoCircle className="inline size-3 text-muted-foreground align-text-bottom" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-60 text-xs">
                            Page shown after a user converts.
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
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
