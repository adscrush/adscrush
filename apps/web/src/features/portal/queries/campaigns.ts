export const portalCampaignKeys = {
  all: ["portalCampaigns"] as const,
  lists: () => [...portalCampaignKeys.all, "list"] as const,
  list: (params: unknown) =>
    [...portalCampaignKeys.lists(), { params }] as const,
}
