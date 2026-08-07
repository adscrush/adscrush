import { router } from "~/lib/trpc/init"
import { advertisersRouter } from "~/modules/advertisers"
import { mediaBuyersRouter } from "~/modules/media-buyers"
import { categoriesRouter } from "~/modules/categories"
import { dashboardRouter } from "~/modules/dashboard"
import { departmentsRouter } from "~/modules/departments"
import { employeesRouter } from "~/modules/employees"
import { productsRouter } from "~/modules/products"
import { campaignsRouter } from "~/modules/campaigns"
import { adAccountsRouter } from "~/modules/ad-accounts"
import { creativesRouter } from "~/modules/creatives"
import { creativeFoldersRouter } from "~/modules/creative-folders"
import { mediaRouter } from "~/modules/media"
import { mediaFoldersRouter } from "~/modules/media-folders"
import { leadsRouter } from "~/modules/leads"
import { portalRouter } from "~/modules/portal"
import { reportsRouter } from "~/modules/reports"
import { settingsRouter } from "~/modules/settings"
import { funnelsRouter } from "~/modules/funnels"
import { languagesRouter } from "~/modules/languages"
import { usersRouter } from "~/modules/users"

export const appRouter = router({
  advertisers: advertisersRouter,
  mediaBuyers: mediaBuyersRouter,
  categories: categoriesRouter,
  departments: departmentsRouter,
  employees: employeesRouter,
  products: productsRouter,
  campaigns: campaignsRouter,
  funnels: funnelsRouter,
  languages: languagesRouter,
  users: usersRouter,
  adAccounts: adAccountsRouter,
  creatives: creativesRouter,
  creativeFolders: creativeFoldersRouter,
  media: mediaRouter,
  mediaFolders: mediaFoldersRouter,
  leads: leadsRouter,
  portal: portalRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  settings: settingsRouter,
})

export type AppRouter = typeof appRouter
