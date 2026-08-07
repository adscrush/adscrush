"use client"

import { ContentShell } from "@/components/common/content-shell"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adscrush/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adscrush/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@adscrush/ui/components/tabs"
import { toast } from "@adscrush/ui/sonner"
import {
  IconBrandGoogle,
  IconBrowser,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconLoader2,
  IconLogout,
  IconMail,
  IconShield,
  IconUser,
  IconCalendar,
  IconCircleCheckFilled,
  IconCircleXFilled,
} from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { notFound } from "next/navigation"
import * as React from "react"
import { BanDialog } from "@/components/common/ban-dialog"
import { ImpersonateDialog } from "@/components/common/impersonate-dialog"
import { UserProfileHeader } from "./user-profile-header"
import { userKeys } from "../query-options"
import { useRevokeSession, useUser, type UserDetail } from "../queries"

interface UserDetailsClientProps {
  id: string
}

function UserDetailsSkeleton() {
  return (
    <ContentShell>
      <div className="space-y-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        </div>
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </ContentShell>
  )
}

function InfoCard({ user }: { user: UserDetail }) {
  const rows = [
    { label: "User ID", value: user.id, icon: IconUser },
    { label: "Email", value: user.email, icon: IconMail },
    {
      label: "Email Verified",
      value: user.emailVerified ? (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <IconCircleCheckFilled className="size-4" />
          Yes
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <IconCircleXFilled className="size-4" />
          No
        </span>
      ),
      icon: IconCircleCheckFilled,
    },
    {
      label: "Role",
      value: (
        <Badge variant="secondary" className="capitalize">
          {user.role?.replace(/_/g, " ")}
        </Badge>
      ),
      icon: IconShield,
    },
    {
      label: "Status",
      value: user.banned ? (
        <Badge variant="destructive">
          Banned{user.banReason ? ` — ${user.banReason}` : ""}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600/30">
          Active
        </Badge>
      ),
      icon: IconShield,
    },
    {
      label: "Joined",
      value: new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: IconCalendar,
    },
    {
      label: "Last Updated",
      value: new Date(user.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      icon: IconCalendar,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>Basic account details and status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <row.icon className="size-4" />
                <span>{row.label}</span>
              </div>
              <div className="font-medium">{row.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LinkedAccountsCard({ user }: { user: UserDetail }) {
  const accounts = user.linkedAccounts

  const providerIcons: Record<string, React.ReactNode> = {
    google: <IconBrandGoogle className="size-5" />,
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>OAuth provider connections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No linked accounts. This user may have signed up with email and password only.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>OAuth provider connections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                {providerIcons[account.providerId] || (
                  <IconBrowser className="size-5 text-muted-foreground" />
                )}
                <span className="font-medium capitalize">{account.providerId}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Linked {new Date(account.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SessionsCard({ user }: { user: UserDetail }) {
  const [revokingSessionId, setRevokingSessionId] = React.useState<string | null>(null)
  const queryClient = useQueryClient()
  const revokeSession = useRevokeSession()
  const sessions = user.sessions

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    try {
      await revokeSession.mutateAsync({ sessionId })
      toast.success("Session revoked")
      await queryClient.invalidateQueries({ queryKey: userKeys.byId(user.id) })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session")
    } finally {
      setRevokingSessionId(null)
    }
  }

  const isSessionExpired = (expiresAt: Date) => new Date(expiresAt) < new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} — revoking a session will sign the user out
          of that device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const expired = isSessionExpired(session.expiresAt)
                const isMobile = session.userAgent
                  ? /mobile|android|iphone|ipad/i.test(session.userAgent)
                  : false

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isMobile ? (
                          <IconDeviceMobile className="size-4 text-muted-foreground" />
                        ) : (
                          <IconDeviceDesktop className="size-4 text-muted-foreground" />
                        )}
                        <span className="text-sm truncate max-w-[200px]">
                          {session.userAgent
                            ? parseUserAgent(session.userAgent)
                            : "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {session.ipAddress || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Expired
                        </Badge>
                      ) : session.impersonatedBy ? (
                        <Badge variant="secondary">Impersonated</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600/30">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!expired && !session.impersonatedBy && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSessionId === session.id}
                        >
                          {revokingSessionId === session.id ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconLogout className="size-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** Extract a readable device summary from a User-Agent string */
function parseUserAgent(ua: string): string {
  // Simple browser detection
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
  if (ua.includes("Edg")) return "Edge"
  if (ua.includes("MSIE") || ua.includes("Trident")) return "Internet Explorer"
  // Fallback: truncate to first segment
  return ua.split("/")[0]?.trim() || "Unknown"
}

export function UserDetailsClient({ id }: UserDetailsClientProps) {
  const queryClient = useQueryClient()
  const { data: user, isLoading, error } = useUser(id)

  const [rowAction, setRowAction] = React.useState<{
    variant: "ban" | "unban" | "impersonate"
  } | null>(null)

  const handleActionClose = (open: boolean) => {
    if (!open) setRowAction(null)
  }

  if (isLoading) {
    return <UserDetailsSkeleton />
  }

  if (error || !user) {
    notFound()
  }

  return (
    <ContentShell>
      <UserProfileHeader
        user={user}
        onBan={() => setRowAction({ variant: "ban" })}
        onUnban={() => setRowAction({ variant: "unban" })}
        onImpersonate={() => setRowAction({ variant: "impersonate" })}
      />

      <Tabs defaultValue="info" className="mt-6">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="accounts">Linked Accounts</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4 max-w-2xl">
          <InfoCard user={user} />
        </TabsContent>
        <TabsContent value="accounts" className="mt-4 max-w-xl">
          <LinkedAccountsCard user={user} />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <SessionsCard user={user} />
        </TabsContent>
      </Tabs>

      <BanDialog
        open={rowAction?.variant === "ban" || rowAction?.variant === "unban"}
        onOpenChange={handleActionClose}
        userId={user?.id}
        name={user?.name}
        variant={rowAction?.variant === "ban" ? "ban" : "unban"}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: userKeys.all })
          await queryClient.invalidateQueries({ queryKey: userKeys.byId(user!.id) })
        }}
      />

      <ImpersonateDialog
        open={rowAction?.variant === "impersonate" || false}
        onOpenChange={handleActionClose}
        userId={user?.id}
        name={user?.name}
        label="User"
      />
    </ContentShell>
  )
}
