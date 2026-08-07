import { TRPCError } from "@trpc/server"

/**
 * Throws a NOT_FOUND error for a resource.
 *
 * @param resourceName - The name of the resource (e.g., "Product", "Campaign")
 * @throws TRPCError with code "NOT_FOUND"
 *
 * @example
 * ```ts
 * if (!product) throwNotFound("Product")
 * ```
 */
export function throwNotFound(resourceName: string): never {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: `${resourceName} not found`,
  })
}

/**
 * Throws a FORBIDDEN error with a custom message.
 *
 * @param message - The error message
 * @throws TRPCError with code "FORBIDDEN"
 *
 * @example
 * ```ts
 * throwForbidden("You don't have permission to access this resource")
 * ```
 */
export function throwForbidden(message: string): never {
  throw new TRPCError({
    code: "FORBIDDEN",
    message,
  })
}

/**
 * Throws an INTERNAL_SERVER_ERROR with a custom message.
 *
 * @param message - The error message
 * @throws TRPCError with code "INTERNAL_SERVER_ERROR"
 *
 * @example
 * ```ts
 * throwInternalError("Failed to create product")
 * ```
 */
export function throwInternalError(message: string): never {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
  })
}

/**
 * Throws a BAD_REQUEST error with a custom message.
 *
 * @param message - The error message
 * @throws TRPCError with code "BAD_REQUEST"
 *
 * @example
 * ```ts
 * throwBadRequest("Invalid permission keys")
 * ```
 */
export function throwBadRequest(message: string): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message,
  })
}

/**
 * Throws a CONFLICT error with a custom message.
 *
 * @param message - The error message
 * @throws TRPCError with code "CONFLICT"
 *
 * @example
 * ```ts
 * throwConflict("This user already has a media buyer profile")
 * ```
 */
export function throwConflict(message: string): never {
  throw new TRPCError({
    code: "CONFLICT",
    message,
  })
}

/**
 * Wraps an async function and throws INTERNAL_SERVER_ERROR if it fails.
 * Re-throws TRPCError instances directly.
 *
 * @param fn - The async function to execute
 * @param errorMessage - The error message if the function fails
 * @returns The result of the function
 * @throws TRPCError
 *
 * @example
 * ```ts
 * const product = await throwOnError(
 *   () => db.insert(products).values(data).returning(),
 *   "Failed to create product"
 * )
 * ```
 */
export async function throwOnError<T>(
  fn: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof TRPCError) throw error
    throwInternalError(errorMessage)
  }
}
