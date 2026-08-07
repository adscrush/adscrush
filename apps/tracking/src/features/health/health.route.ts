import { Elysia } from "elysia"

export const healthRoute = new Elysia().get("/health", () => ({
  status: "ok",
  service: "tracking",
  timestamp: new Date().toISOString(),
}))
