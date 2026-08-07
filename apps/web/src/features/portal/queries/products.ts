export const portalProductKeys = {
  all: ["portalProducts"] as const,
  lists: () => [...portalProductKeys.all, "list"] as const,
  list: (params: unknown) =>
    [...portalProductKeys.lists(), { params }] as const,
}
