"use client"

import { useRouter } from "next/navigation"
import { toast } from "@adscrush/ui/sonner"
import { FunnelForm } from "@/features/funnels/components/funnel-form"
import { useFunnel, useUpdateFunnel } from "@/features/funnels/queries"
import { Skeleton } from "@adscrush/ui/components/skeleton"

interface Props {
  id: string
}

export function EditFunnelClient({ id }: Props) {
  const router = useRouter()
  const { data: funnel, isLoading } = useFunnel(id)
  const updateFunnel = useUpdateFunnel()

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!funnel) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-semibold">Funnel not found</h2>
      </div>
    )
  }

  return (
    <FunnelForm
      initialData={{
        productId: funnel.productId,
        name: funnel.name,
        language: funnel.language,
        domain: funnel.domain,
        pageUrl: funnel.pageUrl,
        thankYouPageUrl: funnel.thankYouPageUrl,
        status: funnel.status,
      }}
      onSubmit={async (data) => {
        try {
          await updateFunnel.mutateAsync({ id, data })
          toast.success("Funnel updated")
          router.push(`/funnels/${id}`)
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to update funnel")
        }
      }}
      isPending={updateFunnel.isPending}
    />
  )
}
