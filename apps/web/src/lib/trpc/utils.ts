import { TRPCClientError } from "@trpc/client"

/**
 * A utility to wrap tRPC calls in Server Components to safely handle errors
 * without crashing the page.
 * 
 * @example
 * const [data, error] = await catchError(trpcServer.example.hello.query({ name: "World" }))
 * if (error) return <div>Error: {error.message}</div>
 */
export async function catchError<T>(promise: Promise<T>) {
  try {
    const data = await promise
    return [data, null] as const
  } catch (error) {
    if (error instanceof TRPCClientError) {
      return [null, error] as const
    }
    if (error instanceof Error) {
      return [null, error] as const
    }
    return [null, new Error("An unknown error occurred")] as const
  }
}
