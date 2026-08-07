export const portalFunnelKeys = {
  all: ["portalFunnels"] as const,
  lists: () => [...portalFunnelKeys.all, "list"] as const,
  list: (params: unknown) =>
    [...portalFunnelKeys.lists(), { params }] as const,
}
