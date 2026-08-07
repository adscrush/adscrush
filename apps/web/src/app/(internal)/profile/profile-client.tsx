"use client"

import { useSession, changePassword, listSessions, revokeSession, revokeOtherSessions } from "@/lib/auth/client"
import { trpc } from "@/lib/trpc/client"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { Switch } from "@adscrush/ui/components/switch"
import { toast } from "@adscrush/ui/sonner"
import {
  IconUpload,
  IconX,
  IconLoader2,
  IconUser,
  IconShield,
} from "@tabler/icons-react"
import { useCallback, useEffect, useRef, useState } from "react"

// ─── Frame Component (shadcn nested card pattern) ───────────────────────────

interface FrameProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

function Frame({ title, description, children, footer }: FrameProps) {
  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-muted/50 p-3">
      {/* Header */}
      <header className="flex flex-col gap-0 px-3 pb-2 pt-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>

      {/* Inner Panel */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="flex justify-end gap-2 px-3 py-2">
          {footer}
        </footer>
      )}
    </div>
  )
}

// ─── Field Group Component ───────────────────────────────────────────────────

interface FieldGroupProps {
  children: React.ReactNode
}

function FieldGroup({ children }: FieldGroupProps) {
  return (
    <div className="flex w-full flex-col gap-0">
      {children}
    </div>
  )
}

// ─── Field Row Component (shadcn responsive pattern) ─────────────────────────

interface FieldRowProps {
  label: string
  description?: string
  children: React.ReactNode
  badge?: React.ReactNode
  htmlFor?: string
}

function FieldRow({ label, description, children, badge, htmlFor }: FieldRowProps) {
  return (
    <div className="group/field flex w-full flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
      {/* Label Section */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:max-w-sm">
        <div className="flex flex-wrap items-center gap-2">
          {htmlFor ? (
            <Label
              htmlFor={htmlFor}
              className="text-sm font-medium text-foreground"
            >
              {label}
            </Label>
          ) : (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Content Section - right-aligned on desktop */}
      <div className="flex min-w-0 flex-1 justify-start sm:max-w-136 sm:justify-end">
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}

// ─── Field Separator (thin line between fields) ─────────────────────────────

function FieldSeparator() {
  return <div className="h-px bg-border" />
}

// ─── Session Helpers ────────────────────────────────────────────────────────

function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown device"

  if (ua.includes("Windows")) return "Windows PC"
  if (ua.includes("Macintosh") || ua.includes("Mac OS")) return "Mac"
  if (ua.includes("Linux")) return "Linux"
  if (ua.includes("Android")) return "Android device"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS device"

  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
  if (ua.includes("Edg")) return "Edge"

  return "Unknown device"
}

function formatSessionTime(date: Date): string {
  const now = new Date()
  const sessionDate = new Date(date)
  const diffMs = now.getTime() - sessionDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return sessionDate.toLocaleDateString()
}

// ─── Sidebar Navigation Tabs ────────────────────────────────────────────────

interface SettingsTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const SETTINGS_TABS: SettingsTab[] = [
  { id: "profile", label: "Profile", icon: IconUser },
  { id: "security", label: "Security", icon: IconShield },

]

// ─── Main Profile Client Component ──────────────────────────────────────────

export function ProfileClient() {
  const { data: session, isPending: sessionPending } = useSession()
  const user = session?.user
  const isMediaBuyer = user?.role === "media_buyer"

  // For media buyers, fetch portal profile
  const { data: portalProfile, isLoading: portalLoading } = trpc.portal.profile.useQuery(
    undefined,
    { enabled: isMediaBuyer }
  )
  const utils = trpc.useUtils()

  // Form state
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentDetails, setPaymentDetails] = useState("")
  const [hasInitialized, setHasInitialized] = useState(false)

  // Sync form when data loads
  if (!hasInitialized) {
    if (isMediaBuyer && portalProfile) {
      setHasInitialized(true)
      setName(portalProfile.name)
      setCompanyName(portalProfile.companyName ?? "")
      setPhoneNumber(portalProfile.phoneNumber ?? "")
      setCountry(portalProfile.country ?? "")
      setPaymentMethod(portalProfile.paymentMethod ?? "")
      setPaymentDetails(portalProfile.paymentDetails ?? "")
    } else if (!isMediaBuyer && user) {
      setHasInitialized(true)
      setName(user.name ?? "")
    }
  }

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(selected)
    setAvatarPreview(URL.createObjectURL(selected))
  }, [avatarPreview])

  const handleAvatarRemove = useCallback(() => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [avatarPreview])

  // Active tab state
  const [activeTab, setActiveTab] = useState("profile")

  // Security state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<Array<{ id: string; token: string; createdAt: Date; expiresAt: Date; ipAddress?: string | null; userAgent?: string | null }>>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Check if form has changes
  const initialValues = isMediaBuyer && portalProfile ? {
    name: portalProfile.name,
    companyName: portalProfile.companyName ?? "",
    phoneNumber: portalProfile.phoneNumber ?? "",
    country: portalProfile.country ?? "",
    paymentMethod: portalProfile.paymentMethod ?? "",
    paymentDetails: portalProfile.paymentDetails ?? "",
  } : !isMediaBuyer && user ? {
    name: user.name ?? "",
    companyName: "",
    phoneNumber: "",
    country: "",
    paymentMethod: "",
    paymentDetails: "",
  } : null

  const hasChanges =
    avatarFile !== null ||
    (initialValues && (
      name !== initialValues.name ||
      companyName !== initialValues.companyName ||
      phoneNumber !== initialValues.phoneNumber ||
      country !== initialValues.country ||
      paymentMethod !== initialValues.paymentMethod ||
      paymentDetails !== initialValues.paymentDetails
    ))

  // Mutation for media buyers
  const updateProfile = trpc.portal.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated")
      utils.portal.profile.invalidate()
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
      }
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleSubmit = () => {
    if (isMediaBuyer) {
      updateProfile.mutate({
        name,
        companyName: companyName || undefined,
        phoneNumber: phoneNumber || undefined,
        country: country || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDetails: paymentDetails || undefined,
      })
    } else {
      // TODO: Wire up admin profile update mutation
      toast.success("Profile updated")
      if (avatarFile) {
        setAvatarFile(null)
        setAvatarPreview(null)
      }
    }
  }

  const handleCancel = () => {
    if (initialValues) {
      setName(initialValues.name)
      setCompanyName(initialValues.companyName)
      setPhoneNumber(initialValues.phoneNumber)
      setCountry(initialValues.country)
      setPaymentMethod(initialValues.paymentMethod)
      setPaymentDetails(initialValues.paymentDetails)
    }
    handleAvatarRemove()
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast.info("Changes discarded")
  }

  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })

      if (error) {
        toast.error(error.message || "Failed to change password")
        return
      }

      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Fetch sessions when Security tab is active
  useEffect(() => {
    if (activeTab !== "security") return

    let cancelled = false
    const loadSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const { data, error } = await listSessions()
        if (cancelled) return
        if (error) {
          console.error("Failed to fetch sessions:", error)
          return
        }
        if (data) {
          setSessions(data)
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
      } finally {
        if (!cancelled) setIsLoadingSessions(false)
      }
    }
    loadSessions()
    return () => { cancelled = true }
  }, [activeTab])

  const refreshSessions = async () => {
    try {
      const { data, error } = await listSessions()
      if (!error && data) {
        setSessions(data)
      }
    } catch {
      // ignore
    }
  }

  const handleRevokeSession = async (token: string) => {
    try {
      const { error } = await revokeSession({ token })
      if (error) {
        toast.error(error.message || "Failed to revoke session")
        return
      }
      toast.success("Session revoked")
      refreshSessions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session")
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      const { error } = await revokeOtherSessions()
      if (error) {
        toast.error(error.message || "Failed to revoke sessions")
        return
      }
      toast.success("All other sessions revoked")
      refreshSessions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke sessions")
    }
  }

  const isLoading = sessionPending || (isMediaBuyer && portalLoading)

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const displayName = isMediaBuyer ? portalProfile?.name : user.name
  const displayEmail = isMediaBuyer ? portalProfile?.email : user.email

  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U"

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your account, workspace, team, and billing.
        </p>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex w-full gap-5 lg:gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-40 shrink-0">
          <div className="flex flex-col gap-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* PROFILE TAB                                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Details Frame */}
              <Frame
                title="Profile details"
                description="Personal account info."
                footer={
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!hasChanges || updateProfile.isPending}>
                      {updateProfile.isPending && (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Save changes
                    </Button>
                  </>
                }
              >
                <FieldGroup>
                  {/* Profile Photo */}
                  <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:max-w-sm">
                      <span className="text-sm font-medium text-foreground">Profile photo</span>
                      <p className="text-sm text-muted-foreground">Shown in comments and mentions.</p>
                    </div>
                    <div className="min-w-0 flex-1 sm:max-w-136">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleAvatarChange}
                          aria-label="Upload profile photo"
                          tabIndex={-1}
                        />
                        <div className="relative">
                          <Avatar size="lg">
                            <AvatarImage
                              src={avatarPreview ?? user.image ?? undefined}
                              alt={displayName ?? ""}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          {avatarFile && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                              New
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <IconUpload className="mr-1.5 size-3.5" />
                          Change
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAvatarRemove}
                          disabled={!avatarPreview && !user.image}
                        >
                          <IconX className="mr-1.5 size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  <FieldSeparator />

                  {/* Full Name */}
                  <FieldRow
                    label="Full name"
                    description="Used across Adscrush."
                    htmlFor="profile-name"
                  >
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </FieldRow>

                  <FieldSeparator />

                  {/* Email */}
                  <FieldRow
                    label="Email address"
                    description="Primary sign-in email."
                    htmlFor="profile-email"
                    badge={
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        Verified
                      </Badge>
                    }
                  >
                    <Input
                      id="profile-email"
                      value={displayEmail ?? ""}
                      disabled
                    />
                  </FieldRow>

                  {/* Media Buyer specific fields */}
                  {isMediaBuyer && (
                    <>
                      <FieldSeparator />

                      <FieldRow
                        label="Phone number"
                        description="Recovery and urgent alerts."
                      >
                        <Input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 718 555 0188"
                          type="tel"
                          autoComplete="tel"
                        />
                      </FieldRow>

                      <FieldSeparator />

                      <FieldRow
                        label="Company"
                        description="Your company name."
                      >
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </FieldRow>

                      <FieldSeparator />

                      <FieldRow
                        label="Country"
                        description="Your country."
                      >
                        <Input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                        />
                      </FieldRow>

                      <FieldSeparator />

                      <FieldRow
                        label="Payment method"
                        description="How you receive payments."
                      >
                        <Input
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          placeholder="e.g., Wire Transfer, PayPal"
                        />
                      </FieldRow>

                      <FieldSeparator />

                      <FieldRow
                        label="Payment details"
                        description="Account details for payments."
                      >
                        <Input
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          placeholder="Account details"
                        />
                      </FieldRow>

                      {portalProfile && (
                        <>
                          <FieldSeparator />
                          <FieldRow label="Member since">
                            <p className="text-sm text-muted-foreground">
                              {portalProfile.createdAt
                                ? new Date(portalProfile.createdAt).toLocaleDateString()
                                : "—"}
                            </p>
                          </FieldRow>
                        </>
                      )}
                    </>
                  )}
                </FieldGroup>
              </Frame>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECURITY TAB                                                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Password Frame */}
              <Frame
                title="Password"
                description="Update your password regularly to keep your account secure."
                footer={
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                  >
                    {isChangingPassword && (
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                }
              >
                <FieldGroup>
                  <FieldRow
                    label="Current password"
                    description="Enter your current password."
                  >
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FieldRow>

                  <FieldSeparator />

                  <FieldRow
                    label="New password"
                    description="Must be at least 8 characters."
                  >
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FieldRow>

                  <FieldSeparator />

                  <FieldRow
                    label="Confirm password"
                    description="Re-enter your new password."
                  >
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FieldRow>
                </FieldGroup>
              </Frame>

              {/* Two-Factor Authentication Frame */}
              <Frame
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account."
              >
                <FieldGroup>
                  <FieldRow
                    label="2FA status"
                    description="Require a verification code when signing in."
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        size="sm"
                        checked={twoFactorEnabled}
                        onCheckedChange={setTwoFactorEnabled}
                      />
                      <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                        {twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </FieldRow>
                </FieldGroup>
              </Frame>

              {/* Active Sessions Frame */}
              <Frame
                title="Active Sessions"
                description="Manage your active sessions across devices."
                footer={
                  sessions.length > 1 ? (
                    <Button variant="outline" className="text-destructive" onClick={handleRevokeAllSessions}>
                      Sign out all other sessions
                    </Button>
                  ) : undefined
                }
              >
                <FieldGroup>
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No active sessions found.
                    </div>
                  ) : (
                    sessions.map((session, index) => {
                      const isCurrent = index === 0
                      const deviceName = session.userAgent ? parseUserAgent(session.userAgent) : "Unknown device"
                      return (
                        <div key={session.id}>
                          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                <IconUser className="size-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {isCurrent ? "This device" : deviceName}
                                  </p>
                                  <Badge variant={isCurrent ? "default" : "secondary"} className="text-xs">
                                    {isCurrent ? "Current" : "Active"}
                                  </Badge>
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatSessionTime(session.createdAt)}</span>
                                  {session.ipAddress && (
                                    <>
                                      <span>·</span>
                                      <span>{session.ipAddress}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRevokeSession(session.token)}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                          {index < sessions.length - 1 && <FieldSeparator />}
                        </div>
                      )
                    })
                  )}
                </FieldGroup>
              </Frame>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
