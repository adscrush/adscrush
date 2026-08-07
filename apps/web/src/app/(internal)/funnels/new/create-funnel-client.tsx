"use client"

import { FunnelCreateWizard } from "@/features/funnels/components/funnel-create-wizard"
import { useCreateFunnel } from "@/features/funnels/queries"
import { useRouter } from "next/navigation"
import { toast } from "@adscrush/ui/sonner"

export function CreateFunnelClient() {
  const router = useRouter()
  const createFunnel = useCreateFunnel()

  return (
    <FunnelCreateWizard
      onSubmit={async (data) => {
        try {
          await createFunnel.mutateAsync(data)
          toast.success("Funnel created")
          router.push("/funnels")
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Failed to create funnel"
          )
        }
      }}
    />
  )
}
