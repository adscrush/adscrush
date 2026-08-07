"use client"

import { trpc } from "@/lib/trpc/client"

export function useSettings() {
  return trpc.settings.getAll.useQuery()
}

export function useUpdateSettings() {
  const utils = trpc.useUtils()

  return trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.getAll.invalidate()
    },
  })
}
