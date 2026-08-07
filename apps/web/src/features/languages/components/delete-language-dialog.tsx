"use client"

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog"
import type { Language } from "../queries"
import { useDeleteLanguage } from "../queries"

interface DeleteLanguageDialogProps {
  language: Language | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteLanguageDialog({
  language,
  open = false,
  onOpenChange,
  onSuccess,
}: DeleteLanguageDialogProps) {
  const deleteMutation = useDeleteLanguage()

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange ?? (() => {})}
      title="Delete Language"
      description="Are you sure you want to delete this language? This action cannot be undone."
      label="language"
      onDelete={async () => {
        if (!language) return
        await deleteMutation.mutateAsync({ id: language.id })
      }}
      isLoading={deleteMutation.isPending}
      onSuccess={onSuccess}
    >
      {language && (
        <div className="rounded-md bg-muted p-4">
          <p className="font-medium">{language.name}</p>
          <p className="text-sm text-muted-foreground font-mono">
            {language.code}
          </p>
        </div>
      )}
    </DeleteConfirmDialog>
  )
}
