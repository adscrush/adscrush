import type { Database } from "@adscrush/db"
import { inArray } from "@adscrush/db/drizzle"
import { type funnels, type landingPages, products } from "@adscrush/db/schema"
import { throwNotFound, throwForbidden, throwInternalError } from "~/lib/helpers/errors"
import type { ListFunnelsInput } from "./funnels.types"
import type { AdvertiserScope } from "~/lib/helpers/scope"
import * as repository from "./funnels.repository"

function buildScopeWhere(scope: AdvertiserScope) {
  return !scope.isAllAdvertisers
    ? inArray(products.advertiserId, scope.advertiserIds.length > 0 ? scope.advertiserIds : ["-1"])
    : undefined
}

export async function listFunnels(db: Database, input: ListFunnelsInput, scope: AdvertiserScope) {
  const scopeWhere = buildScopeWhere(scope)
  return repository.findFunnelsPaginated(db, input, scopeWhere)
}

export async function getFunnelById(db: Database, id: string, scope: AdvertiserScope) {
  const result = await repository.findFunnelById(db, id)
  if (!result) throwNotFound("Funnel")

  if (!scope.isAllAdvertisers && !scope.advertiserIds.includes(result.advertiserId)) {
    throwForbidden("You do not have access to this funnel")
  }

  const landingPages = await repository.findLandingPages(db, id)
  const { advertiserId: _, ...funnelResult } = result
  return { ...funnelResult, landingPages }
}

export async function createFunnel(db: Database, data: typeof funnels.$inferInsert & { landingPages?: Array<{ name?: string | null; url?: string | null; weight?: number | null; status?: "active" | "inactive" }> }) {
  const { landingPages: lpData, ...funnelData } = data

  const funnel = await repository.createFunnel(db, funnelData)
  if (!funnel) throwInternalError("Failed to create funnel")

  if (lpData && lpData.length > 0) {
    const rows = lpData.map((lp) => ({
      funnelId: funnel.id,
      name: lp.name ?? "Landing Page",
      url: lp.url ?? "",
      weight: lp.weight ?? null,
      status: (lp.status ?? "active") as "active" | "inactive",
    }))
    await repository.createLandingPages(db, rows)
  }

  return funnel
}

export async function updateFunnel(db: Database, id: string, data: Partial<typeof funnels.$inferInsert>) {
  const updated = await repository.updateFunnel(db, id, data)
  if (!updated) throwNotFound("Funnel")
  return updated
}

export async function deleteFunnel(db: Database, id: string) {
  const deleted = await repository.deleteFunnel(db, id)
  if (!deleted) throwNotFound("Funnel")
  return { success: true }
}

export async function addLandingPage(db: Database, funnelId: string, name?: string, url?: string, weight?: number | null) {
  return repository.createSingleLandingPage(db, {
    funnelId,
    name: name || "Landing Page",
    url: url || "",
    weight: weight ?? null,
  })
}

export async function bulkAddLandingPages(db: Database, funnelId: string, landingPagesData: Array<{ name?: string; url: string; weight?: number | null }>) {
  const rows = landingPagesData.map((lp) => ({
    funnelId,
    name: lp.name || "Landing Page",
    url: lp.url,
    weight: lp.weight ?? null,
  }))
  return repository.createLandingPages(db, rows)
}

export async function updateLandingPage(db: Database, id: string, data: Partial<typeof landingPages.$inferInsert>) {
  const updated = await repository.updateLandingPage(db, id, data)
  if (!updated) throwNotFound("Landing page")
  return updated
}

export async function deleteLandingPage(db: Database, id: string) {
  return repository.deleteLandingPage(db, id)
}

export async function getLandingPages(db: Database, funnelId: string) {
  return repository.findAllLandingPages(db, funnelId)
}

export async function getFunnelCounts(db: Database, scope: AdvertiserScope) {
  const scopeWhere = buildScopeWhere(scope)
  return repository.getFunnelCounts(db, scopeWhere)
}

export async function searchFunnels(db: Database, q?: string, limit?: number, ids?: string[], scope?: AdvertiserScope) {
  const scopeWhere = scope ? buildScopeWhere(scope) : undefined
  return repository.searchFunnels(db, q, limit, ids, scopeWhere)
}
