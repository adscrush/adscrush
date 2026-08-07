"use client"

import { createProductSchema } from "@adscrush/shared/validators/product.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@adscrush/ui/sonner"
import { useRouter } from "next/navigation"
import { FormProvider, useForm } from "react-hook-form"
import type { z } from "zod"

import { useCreateProduct, useUpdateProduct } from "../queries"
import { useNavigationGuard } from "../hooks/use-navigation-guard"
import { TitleField } from "./title-field"
import { PricingSection } from "./pricing-section"
import { MediaSection } from "./media-section"
import { CategorySection } from "./category-section"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ProductOrganizationCard } from "./product-organization-card"
import { TopBar } from "@/components/common/top-bar"
import { StatusCard } from "./status-card"

export type ProductFormValues = z.input<typeof createProductSchema>

const SUBMISSION_TIMEOUT_MS = 30_000

interface ProductFormProps {
  mode: "create" | "edit"
  productId?: string
  defaultValues: ProductFormValues
}

/**
 * Shared product create/edit form. In "edit" mode it submits to the update
 * mutation (which re-syncs media/metafields); otherwise it creates.
 */
export function ProductForm({ mode, productId, defaultValues }: ProductFormProps) {
  const router = useRouter()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues,
  })

  // Navigation guard to prevent accidental data loss
  useNavigationGuard(form.formState.isDirty)

  const onSubmit = async (data: ProductFormValues) => {
    const timeoutId = setTimeout(() => {
      toast.error("Request timed out. Please try again.", { duration: 5000 })
    }, SUBMISSION_TIMEOUT_MS)

    try {
      if (mode === "edit" && productId) {
        await updateProduct.mutateAsync({ id: productId, data })
      } else {
        await createProduct.mutateAsync(data)
      }

      clearTimeout(timeoutId)
      // Clear the dirty state so the navigation guard does not block the push
      form.reset(data)
      toast.success(
        mode === "edit"
          ? "Product updated successfully"
          : "Product created successfully",
        { duration: 5000 }
      )
      router.push("/products")
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      // Handle tRPC validation errors (BAD_REQUEST) - map field errors inline
      const trpcError = error as { data?: { code?: string; httpStatus?: number; zodError?: { fieldErrors?: Record<string, string[]> } }; message?: string }
      if (trpcError?.data?.code === "BAD_REQUEST" || trpcError?.data?.httpStatus === 400) {
        const zodError = trpcError?.data?.zodError
        if (zodError?.fieldErrors) {
          const fieldErrors: Record<string, string[]> = zodError.fieldErrors
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (messages && messages.length > 0) {
              form.setError(field as keyof ProductFormValues, {
                type: "server",
                message: messages[0],
              })
            }
          }
          return
        }

        toast.error(trpcError.message || "Validation error", { duration: 5000 })
        return
      }

      toast.error(trpcError.message || "An unexpected error occurred", {
        duration: 5000,
      })
    }
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col"
      >
        <TopBar label="product" isDirty={form.formState.isDirty} isSubmitting={form.formState.isSubmitting} onDiscard={() => form.reset()} />
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Main content area (left column - 2/3 width) */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-card p-4">
              <TitleField />
            </div>

            <RichTextEditor
              value={form.watch("description") ?? ""}
              onChange={(html) => form.setValue("description", html, { shouldDirty: true })}
              placeholder="Write a product description..."
              maxLength={50000}
            />

            <MediaSection />

            <PricingSection />

          </div>

          {/* Sidebar (right column - 1/3 width) */}
          <div className="space-y-6">
            <StatusCard />

            <ProductOrganizationCard />

            <CategorySection />

          </div>
        </div>
      </form>
    </FormProvider>
  )
}
