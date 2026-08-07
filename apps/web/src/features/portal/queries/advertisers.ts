export const portalAdvertiserKeys = {
  all: ["portalAdvertisers"] as const,
  lists: () => [...portalAdvertiserKeys.all, "list"] as const,
  list: (params: unknown) =>
    [...portalAdvertiserKeys.lists(), { params }] as const,
}
