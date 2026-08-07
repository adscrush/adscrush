import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createContext } from "./lib/trpc/context"
import { appRouter } from "./routers/_app"
import { env } from "./env"
import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { authRoutes } from "./modules/auth"
import { logger } from "./lib/logger"

const log = logger({ module: "server" })

const app = new Elysia()
void app
  .use(
    cors({
      origin: [env.FRONTEND_APP_URL, "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source", "x-captcha-response"],
    })
  )
  .get("/health", () => ({ status: "ok", service: "trpc-server", timestamp: new Date().toISOString() }))
  .group("/api/v1", (api) => 
    api.use(authRoutes)
  )
  .all("/trpc/*", async ({ request }) => {
    return fetchRequestHandler({
      endpoint: "/trpc",
      req: request,
      router: appRouter,
      createContext,
    })
  })
  .listen(env.PORT)

log.info(`Server running at http://localhost:${env.PORT}`)
log.info(`tRPC API available at http://localhost:${env.PORT}/trpc`)
log.info(`Auth API available at http://localhost:${env.PORT}/api/v1/auth`)

export type AppType = typeof app
