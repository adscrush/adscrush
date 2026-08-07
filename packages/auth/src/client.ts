import { createAuthClient as createBetterAuthClient } from "better-auth/react"
import { adminClient, customSessionClient, inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins"
import type { Auth } from "./server"

interface CreateAuthClientProps {
  baseURL: string
  basePath?: string
}

export const createAuthClient = (props: CreateAuthClientProps) =>
  createBetterAuthClient({
    baseURL: props.baseURL,
    basePath: props.basePath ?? "/api/v1/auth",
    plugins: [magicLinkClient(), inferAdditionalFields<Auth>(), customSessionClient<Auth>(), adminClient()],
    fetchOptions: {
      credentials: "include",
    },
  })

/**
 * Re-exports symbols that appear in the inferred type of `createAuthClient` so declaration emit
 * (TS2883 / “cannot be named without a reference …”) can serialize `.d.ts` output for this package.
 *
 * **Temporary:** remove when better-auth’s published types no longer force consumers to anchor these
 * names (see issues below).
 *
 * @see https://github.com/better-auth/better-auth/issues/4250
 * @see https://github.com/better-auth/better-auth/issues/8623
 */
export type { AuthQueryAtom, InferSignUpEmailCtx, InferUserUpdateCtx } from "better-auth/client"
export type { FieldAttributeToObject } from "better-auth/db"
