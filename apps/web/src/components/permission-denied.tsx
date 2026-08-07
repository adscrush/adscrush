import { IconLock } from "@tabler/icons-react"

interface PermissionDeniedProps {
  resource?: string
}

/**
 * Server-renderable fallback shown when a user lacks the required permission
 * to view a page or resource.
 */
export function PermissionDenied({ resource }: PermissionDeniedProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <IconLock className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {resource
            ? `You don't have permission to view ${resource}. Contact your administrator to request access.`
            : "You don't have permission to view this resource. Contact your administrator to request access."}
        </p>
      </div>
    </div>
  )
}
