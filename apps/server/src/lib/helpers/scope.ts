import { TRPCError } from "@trpc/server"

/**
 * Scope type for advertiser-based access control
 */
export interface AdvertiserScope {
  isAllAdvertisers: boolean
  advertiserIds: string[]
}

/**
 * Scope type for media buyer-based access control
 */
export interface MediaBuyerScope {
  isAllMediaBuyers: boolean
  mediaBuyerIds: string[]
}

/**
 * Combined scope type used in many services
 */
export type Scope = AdvertiserScope | MediaBuyerScope

/**
 * Validates that a user has access to a specific advertiser.
 * Throws FORBIDDEN error if access is denied.
 *
 * @param scope - The user's scope with advertiser access
 * @param advertiserId - The advertiser ID to check access for
 * @throws TRPCError with code "FORBIDDEN" if access is denied
 *
 * @example
 * ```ts
 * const scope = await getScope(db, user.id, user.role)
 * validateAdvertiserAccess(scope, product.advertiserId)
 * ```
 */
export function validateAdvertiserAccess(
  scope: AdvertiserScope,
  advertiserId: string
): void {
  if (!scope.isAllAdvertisers && !scope.advertiserIds.includes(advertiserId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this advertiser",
    })
  }
}

/**
 * Validates that a user has access to a specific media buyer.
 * Throws FORBIDDEN error if access is denied.
 *
 * @param scope - The user's scope with media buyer access
 * @param mediaBuyerId - The media buyer ID to check access for
 * @throws TRPCError with code "FORBIDDEN" if access is denied
 *
 * @example
 * ```ts
 * const scope = await getScope(db, user.id, user.role)
 * validateMediaBuyerAccess(scope, mediaBuyer.id)
 * ```
 */
export function validateMediaBuyerAccess(
  scope: MediaBuyerScope,
  mediaBuyerId: string
): void {
  if (!scope.isAllMediaBuyers && !scope.mediaBuyerIds.includes(mediaBuyerId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this media buyer",
    })
  }
}

/**
 * Validates that a user has access to a resource based on scope type.
 * Automatically determines whether to check advertiser or media buyer access.
 *
 * @param scope - The user's scope
 * @param resourceId - The resource ID to check access for
 * @param scopeType - Whether this is an advertiser or media buyer scope
 * @throws TRPCError with code "FORBIDDEN" if access is denied
 *
 * @example
 * ```ts
 * validateScopeAccess(scope, product.advertiserId, "advertiser")
 * validateScopeAccess(scope, mediaBuyer.id, "mediaBuyer")
 * ```
 */
export function validateScopeAccess(
  scope: AdvertiserScope | MediaBuyerScope,
  resourceId: string,
  scopeType: "advertiser" | "mediaBuyer"
): void {
  if (scopeType === "advertiser") {
    validateAdvertiserAccess(scope as AdvertiserScope, resourceId)
  } else {
    validateMediaBuyerAccess(scope as MediaBuyerScope, resourceId)
  }
}
