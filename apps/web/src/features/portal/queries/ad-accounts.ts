export const portalAdAccountKeys = {
  all: ["portalAdAccounts"] as const,
  lists: () => [...portalAdAccountKeys.all, "list"] as const,
  list: (params: unknown) =>
    [...portalAdAccountKeys.lists(), { params }] as const,
}
