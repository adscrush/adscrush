"use client"

import { trpc } from "@/lib/trpc/client"
import { ContentShell } from "@/components/common/content-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@adscrush/ui/components/avatar"
import { Badge } from "@adscrush/ui/components/badge"
import { Button } from "@adscrush/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@adscrush/ui/components/card"
import { Input } from "@adscrush/ui/components/input"
import { Label } from "@adscrush/ui/components/label"
import { Skeleton } from "@adscrush/ui/components/skeleton"
import { toast } from "@adscrush/ui/sonner"
import {
  IconUpload,
  IconX,
  IconLoader2,
} from "@tabler/icons-react"
import { useCallback, useEffect, useRef, useState } from "react"

// ─── Profile Form Row Component ─────────────────────────────────────────────

interface ProfileFormRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

function ProfileFormRow({ label, description, children }: ProfileFormRowProps) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="flex-1 space-y-0.5">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ─── Main Profile Client Component ──────────────────────────────────────────

export function EmpProfileClient() {
  const { data: profile, isLoading } = trpc.portal.profile.useQuery()
  const utils = trpc.useUtils()

  // Form state
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentDetails, setPaymentDetails] = useState("")
  const [hasInitialized, setHasInitialized] = useState(false)

  // Sync form when profile loads
  if (profile && !hasInitialized) {
    setHasInitialized(true)
    setName(profile.name)
    setCompanyName(profile.companyName ?? "")
    setPhoneNumber(profile.phoneNumber ?? "")
    setCountry(profile.country ?? "")
    setPaymentMethod(profile.paymentMethod ?? "")
    setPaymentDetails(profile.paymentDetails ?? "")
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

  // Check if form has changes
  const initialValues = profile ? {
    name: profile.name,
    companyName: profile.companyName ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    country: profile.country ?? "",
    paymentMethod: profile.paymentMethod ?? "",
    paymentDetails: profile.paymentDetails ?? "",
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
    updateProfile.mutate({
      name,
      companyName: companyName || undefined,
      phoneNumber: phoneNumber || undefined,
      country: country || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentDetails: paymentDetails || undefined,
    })
  }

  const handleCancel = () => {
    if (profile) {
      setName(profile.name)
      setCompanyName(profile.companyName ?? "")
      setPhoneNumber(profile.phoneNumber ?? "")
      setCountry(profile.country ?? "")
      setPaymentMethod(profile.paymentMethod ?? "")
      setPaymentDetails(profile.paymentDetails ?? "")
    }
    handleAvatarRemove()
    toast.info("Changes discarded")
  }

  if (isLoading) {
    return (
      <ContentShell>
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
      </ContentShell>
    )
  }

  if (!profile) return null

  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U"

  return (
    <ContentShell>
      <div className="flex flex-1 flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your account and billing info.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Details Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Profile Details</CardTitle>
              <CardDescription>Personal account info.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border pt-0">
              {/* Profile Photo Row */}
              <ProfileFormRow
                label="Profile Photo"
                description="Shown in comments and mentions."
              >
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div className="relative">
                    <Avatar size="lg">
                      <AvatarImage
                        src={avatarPreview ?? undefined}
                        alt={profile.name ?? ""}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    {avatarFile && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                      disabled={!avatarPreview}
                    >
                      <IconX className="mr-1.5 size-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              </ProfileFormRow>

              {/* Name Row */}
              <ProfileFormRow label="Name" description="Your display name.">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="max-w-md"
                  required
                />
              </ProfileFormRow>

              {/* Email Row */}
              <ProfileFormRow
                label="Email Address"
                description="Primary sign-in email."
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={profile.email}
                    disabled
                    className="max-w-md"
                  />
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  >
                    Verified
                  </Badge>
                </div>
              </ProfileFormRow>

              {/* Phone Number Row */}
              <ProfileFormRow
                label="Phone Number"
                description="Recovery and urgent alerts."
              >
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 718 555 0188"
                  className="max-w-md"
                />
              </ProfileFormRow>

              {/* Company Row */}
              <ProfileFormRow label="Company" description="Your company name.">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="max-w-md"
                />
              </ProfileFormRow>

              {/* Country Row */}
              <ProfileFormRow label="Country" description="Your country.">
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="max-w-md"
                />
              </ProfileFormRow>

              {/* Payment Method Row */}
              <ProfileFormRow
                label="Payment Method"
                description="How you receive payments."
              >
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g., Wire Transfer, PayPal"
                  className="max-w-md"
                />
              </ProfileFormRow>

              {/* Payment Details Row */}
              <ProfileFormRow
                label="Payment Details"
                description="Account details for payments."
              >
                <Input
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Account details"
                  className="max-w-md"
                />
              </ProfileFormRow>

              {/* Actions Row */}
              <div className="flex items-center justify-end gap-3 pt-5">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!hasChanges || updateProfile.isPending}>
                  {updateProfile.isPending && (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Account Info</CardTitle>
              <CardDescription>Your account status and details.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border pt-0">
              {/* Status Row */}
              <ProfileFormRow label="Status">
                <Badge
                  variant={profile.status === "active" ? "default" : "secondary"}
                >
                  {profile.status}
                </Badge>
              </ProfileFormRow>

              {/* Account Manager Row */}
              {profile.accountManager && (
                <ProfileFormRow label="Account Manager">
                  <p className="text-sm">{profile.accountManager.name}</p>
                </ProfileFormRow>
              )}

              {/* Traffic Sources Row */}
              {profile.trafficSources && profile.trafficSources.length > 0 && (
                <ProfileFormRow label="Traffic Sources">
                  <div className="flex flex-wrap gap-1">
                    {profile.trafficSources.map((source) => (
                      <Badge key={source} variant="outline">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </ProfileFormRow>
              )}

              {/* Member Since Row */}
              <ProfileFormRow label="Member Since">
                <p className="text-sm">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </ProfileFormRow>
            </CardContent>
          </Card>

        </div>
      </div>
    </ContentShell>
  )
}
