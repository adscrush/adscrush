"use client"

import type { AppRouter } from "@adscrush/server"
import type { CreateTRPCReact } from "@trpc/react-query"
import { createTRPCReact } from "@trpc/react-query"

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>()