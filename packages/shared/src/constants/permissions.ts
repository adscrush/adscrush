/**
 * Central Permission Registry — single source of truth for all permission keys.
 *
 * Structure: module → section → entry[]
 * Declared `as const` so TypeScript infers literal types for every key.
 *
 * All downstream types (`Permission`, `ALL_PERMISSION_KEYS`, `ALL_PERMISSION_ENTRIES`,
 * `PERMISSION_PRESETS`, `PermissionPreset`) are derived from this object automatically.
 * No manual union types are needed.
 */
export const PERMISSION_REGISTRY = {
  account: {
    general: [
      { key: "account.view", label: "View Account", module: "account", section: "general", isGate: true },
      { key: "account.edit", label: "Edit Account", module: "account", section: "general", isGate: false },
    ],
  },

  advertiser: {
    profile: [
      { key: "advertiser.view", label: "View Advertisers", module: "advertiser", section: "profile", isGate: true },
      { key: "advertiser.advertiser_access", label: "Advertiser Access", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.account_manager", label: "Account Manager", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.additional_info", label: "Additional Info", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.address", label: "Address", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.advertiser_model", label: "Advertiser Model", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.approval", label: "Approval", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.city", label: "City", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.company", label: "Company", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.contact", label: "Contact", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.country", label: "Country", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.currency", label: "Currency", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.email", label: "Email", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.employee", label: "Employee", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.job_title", label: "Job Title", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.last_login", label: "Last Login", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.login", label: "Login", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.name", label: "Name", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.note", label: "Note", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.option_button", label: "Option Button", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.password_reset", label: "Password Reset", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.payment_profile", label: "Payment Profile", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.signup_date", label: "Signup Date", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.signup_ip", label: "Signup IP", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.social", label: "Social", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.state", label: "State", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.status", label: "Status", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.tax_numbers", label: "Tax Numbers", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.timezone", label: "Timezone", module: "advertiser", section: "profile", isGate: false },
      { key: "advertiser.advertiser_field", label: "Advertiser Field", module: "advertiser", section: "profile", isGate: false },
    ],
    crm: [
      { key: "advertiser.create", label: "Create Advertiser", module: "advertiser", section: "crm", isGate: false },
      { key: "advertiser.edit", label: "Edit Advertiser", module: "advertiser", section: "crm", isGate: false },
      { key: "advertiser.delete", label: "Delete Advertiser", module: "advertiser", section: "crm", isGate: false },
    ],
  },

  media_buyers: {
    general: [
      { key: "media_buyers.view", label: "View Media Buyers", module: "media_buyers", section: "general", isGate: true },
      { key: "media_buyers.create", label: "Create Media Buyer", module: "media_buyers", section: "general", isGate: false },
      { key: "media_buyers.edit", label: "Edit Media Buyer", module: "media_buyers", section: "general", isGate: false },
      { key: "media_buyers.delete", label: "Delete Media Buyer", module: "media_buyers", section: "general", isGate: false },
    ],
  },

  products: {
    general: [
      { key: "products.view", label: "View Products", module: "products", section: "general", isGate: true },
      { key: "products.create", label: "Create Product", module: "products", section: "general", isGate: false },
      { key: "products.edit", label: "Edit Product", module: "products", section: "general", isGate: false },
      { key: "products.delete", label: "Delete Product", module: "products", section: "general", isGate: false },
    ],
    media_buyers: [
      { key: "products.manage_media_buyers", label: "Manage Media Buyers", module: "products", section: "media_buyers", isGate: false },
    ],
  },

  campaigns: {
    general: [
      { key: "campaigns.view", label: "View Campaigns", module: "campaigns", section: "general", isGate: true },
      { key: "campaigns.create", label: "Create Campaign", module: "campaigns", section: "general", isGate: false },
      { key: "campaigns.edit", label: "Edit Campaign", module: "campaigns", section: "general", isGate: false },
      { key: "campaigns.delete", label: "Delete Campaign", module: "campaigns", section: "general", isGate: false },
    ],
  },

  funnels: {
    general: [
      { key: "funnels.view", label: "View Funnels", module: "funnels", section: "general", isGate: true },
      { key: "funnels.create", label: "Create Funnel", module: "funnels", section: "general", isGate: false },
      { key: "funnels.edit", label: "Edit Funnel", module: "funnels", section: "general", isGate: false },
      { key: "funnels.delete", label: "Delete Funnel", module: "funnels", section: "general", isGate: false },
    ],
  },

  creatives: {
    general: [
      { key: "creatives.view", label: "View Creatives", module: "creatives", section: "general", isGate: true },
      { key: "creatives.upload", label: "Upload Creative", module: "creatives", section: "general", isGate: false },
      { key: "creatives.delete", label: "Delete Creative", module: "creatives", section: "general", isGate: false },
    ],
  },

  media: {
    general: [
      { key: "media.admin", label: "Media Admin", module: "media", section: "general", isGate: true },
      { key: "media.upload", label: "Upload Media", module: "media", section: "general", isGate: false },
    ],
  },

  leads: {
    general: [
      { key: "leads.view", label: "View Leads", module: "leads", section: "general", isGate: true },
      { key: "leads.manage", label: "Manage Leads (approve/reject)", module: "leads", section: "general", isGate: false },
    ],
  },

  ad_accounts: {
    general: [
      { key: "ad_accounts.view", label: "View Ad Accounts", module: "ad_accounts", section: "general", isGate: true },
      { key: "ad_accounts.manage", label: "Manage Ad Accounts", module: "ad_accounts", section: "general", isGate: false },
    ],
  },

  report: {
    capping_logs: [
      { key: "report.logs_capping_access", label: "Capping Logs Access", module: "report", section: "capping_logs", isGate: true },
    ],
    click_logs: [
      { key: "report.click_log_access", label: "Click Log Access", module: "report", section: "click_logs", isGate: true },
    ],
    conversion_logs: [
      { key: "report.conversion_log_access", label: "Conversion Log Access", module: "report", section: "conversion_logs", isGate: true },
      { key: "report.conv_advertiser", label: "Conv Advertiser", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_advertiser_id", label: "Conv Advertiser ID", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_advertiser_model", label: "Conv Advertiser Model", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_advertiser_revenue", label: "Conv Advertiser Revenue", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub1", label: "Conv Adv Sub1", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub2", label: "Conv Adv Sub2", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub3", label: "Conv Adv Sub3", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub4", label: "Conv Adv Sub4", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub5", label: "Conv Adv Sub5", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_adv_sub7", label: "Conv Adv Sub7", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_media_buyer", label: "Conv Media Buyer", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_media_buyer_id", label: "Conv Media Buyer ID", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_media_buyer_model", label: "Conv Media Buyer Model", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_media_buyer_payout", label: "Conv Media Buyer Payout", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_click_id", label: "Conv MB Click ID", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub1", label: "Conv MB Sub1", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub2", label: "Conv MB Sub2", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub3", label: "Conv MB Sub3", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub4", label: "Conv MB Sub4", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub5", label: "Conv MB Sub5", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub6", label: "Conv MB Sub6", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub7", label: "Conv MB Sub7", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub8", label: "Conv MB Sub8", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub9", label: "Conv MB Sub9", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_mb_sub10", label: "Conv MB Sub10", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_android_id", label: "Conv Android ID", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_bet_amount", label: "Conv Bet Amount", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_bonus_amount", label: "Conv Bonus Amount", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_click_ip", label: "Conv Click IP", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_click_time", label: "Conv Click Time", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_conversion_delay", label: "Conv Conversion Delay", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_conversion_time", label: "Conv Conversion Time", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_coupon", label: "Conv Coupon", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_creative_id", label: "Conv Creative ID", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_currency", label: "Conv Currency", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_date", label: "Conv Date", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_deposit_amount", label: "Conv Deposit Amount", module: "report", section: "conversion_logs", isGate: false },
      { key: "report.conv_device_id", label: "Conv Device ID", module: "report", section: "conversion_logs", isGate: false },
    ],
    general: [
      { key: "report.view", label: "View Reports", module: "report", section: "general", isGate: true },
      { key: "report.export", label: "Export Reports", module: "report", section: "general", isGate: false },
    ],
  },

  employees: {
    general: [
      { key: "employees.view", label: "View Employees", module: "employees", section: "general", isGate: true },
      { key: "employees.create", label: "Create Employee", module: "employees", section: "general", isGate: false },
      { key: "employees.manage", label: "Manage Employees", module: "employees", section: "general", isGate: false },
    ],
    departments: [
      { key: "employees.departments_view", label: "View Departments", module: "employees", section: "departments", isGate: true },
      { key: "employees.departments_create", label: "Create Department", module: "employees", section: "departments", isGate: false },
    ],
  },

  settings: {
    general: [
      { key: "settings.view", label: "View Settings", module: "settings", section: "general", isGate: true },
      { key: "settings.edit", label: "Edit Settings", module: "settings", section: "general", isGate: false },
    ],
  },
} as const

// ---------------------------------------------------------------------------
// Type derivation — all types flow from the registry, no manual unions
// ---------------------------------------------------------------------------

/**
 * Recursively extracts all `key` string literals from a nested object/array
 * structure. Works by distributing over unions at each level.
 */
type DeepExtractKeys<T> =
  T extends { key: infer K extends string }
    ? K
    : T extends readonly (infer Item)[]
      ? DeepExtractKeys<Item>
      : T extends object
        ? DeepExtractKeys<T[keyof T]>
        : never

/** Union of every permission key string in the registry. */
export type Permission = DeepExtractKeys<typeof PERMISSION_REGISTRY>

// ---------------------------------------------------------------------------
// Flat arrays derived from the registry
// ---------------------------------------------------------------------------

/** Flat array of every permission entry object. Used for UI rendering. */
export const ALL_PERMISSION_ENTRIES = Object.values(PERMISSION_REGISTRY)
  .flatMap((module) => Object.values(module))
  .flatMap((section) => section) as unknown as Array<{
  key: Permission
  label: string
  module: string
  section: string
  isGate: boolean
}>

/** Flat array of every permission key string. Used for validation and the `full` preset. */
export const ALL_PERMISSION_KEYS: Permission[] = ALL_PERMISSION_ENTRIES.map(
  (entry) => entry.key,
)

// ---------------------------------------------------------------------------
// Permission Presets
// ---------------------------------------------------------------------------

const _READONLY_PRESET = [
  // Account
  "account.view",
  // Advertiser (field-level)
  "advertiser.view",
  "advertiser.advertiser_access",
  // Media Buyers
  "media_buyers.view",
  // Products
  "products.view",
  // Campaigns
  "campaigns.view",
  // Creatives
  "creatives.view",
  // Ad Accounts
  "ad_accounts.view",
  // Report
  "report.logs_capping_access",
  "report.click_log_access",
  "report.conversion_log_access",
  "leads.view",
  "report.view",
  // Employees
  "employees.view",
  "employees.departments_view",
  // Settings
  "settings.view",
] satisfies Permission[]

const _MANAGER_PRESET = [
  // Account
  "account.view",
  "account.edit",
  // Advertiser (field-level)
  "advertiser.view",
  "advertiser.advertiser_access",
  "advertiser.create",
  "advertiser.edit",
  "advertiser.name",
  "advertiser.email",
  "advertiser.status",
  "advertiser.contact",
  "advertiser.company",
  "advertiser.country",
  "advertiser.currency",
  "advertiser.timezone",
  "advertiser.note",
  "advertiser.account_manager",
  // Media Buyers
  "media_buyers.view",
  "media_buyers.create",
  "media_buyers.edit",
  // Products
  "products.view",
  "products.create",
  "products.edit",
  "products.manage_media_buyers",
  // Campaigns
  "campaigns.view",
  "campaigns.create",
  "campaigns.edit",
  // Creatives
  "creatives.view",
  "creatives.upload",
  // Ad Accounts
  "ad_accounts.view",
  "ad_accounts.manage",
  // Report
  "report.view",
  "report.export",
  "report.logs_capping_access",
  "report.click_log_access",
  "report.conversion_log_access",
  "leads.view",
  "leads.manage",
  "report.conv_advertiser",
  "report.conv_advertiser_id",
  "report.conv_media_buyer",
  "report.conv_media_buyer_id",
  "report.conv_media_buyer_payout",
  "report.conv_click_time",
  "report.conv_conversion_time",
  "report.conv_date",
  // Employees
  "employees.view",
  "employees.departments_view",
  "employees.departments_create",
  // Settings
  "settings.view",
  "settings.edit",
] satisfies Permission[]

const _BD_SALES_PRESET = [
  "advertiser.view",
  "products.view",
  "report.view",
] satisfies Permission[]

const _OPERATIONS_PRESET = [
  "media_buyers.view",
  "media_buyers.create",
  "media_buyers.edit",
  "products.view",
  "products.edit",
  "products.manage_media_buyers",
  "creatives.view",
  "creatives.upload",
  "report.view",
  "report.export",
] satisfies Permission[]

export const PERMISSION_PRESETS: Record<string, Permission[]> = {
  /**
   * Full access — derived programmatically so it never goes stale when new
   * permissions are added to the registry.
   */
  full: ALL_PERMISSION_KEYS,

  /**
   * Read-only access — gate permissions and view-level permissions only.
   * No write, mutating, or destructive permissions.
   */
  readonly: _READONLY_PRESET,

  /**
   * Manager access — view and edit for core modules, no destructive or
   * administrative permissions.
   */
  manager: _MANAGER_PRESET,

  /**
   * BD/Sales access — advertiser viewing, lead viewing/export, product viewing, report viewing.
   */
  bd_sales: _BD_SALES_PRESET,

  /**
   * Operations access — media buyer management, product editing, creative upload, lead view.
   */
  operations: _OPERATIONS_PRESET,
}

/** Union of all preset names. */
export type PermissionPreset = "full" | "manager" | "readonly" | "bd_sales" | "operations"

// ---------------------------------------------------------------------------
// Media buyer implicit permissions — granted by role, no employee record needed
// ---------------------------------------------------------------------------

export const MEDIA_BUYER_PERMISSIONS: readonly Permission[] = [
  "report.view",
  "report.click_log_access",
  "report.conversion_log_access",
  "leads.view",
  "ad_accounts.view",
  "media.upload",
  "campaigns.view",
  "creatives.view",
  "products.view",
  "funnels.view",
  "advertiser.view",
  "account.view",
] as const

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Filters an array of raw strings, returning only those that are valid
 * `Permission` keys. Unknown keys are silently dropped.
 *
 * Used by the cache loader to handle forward-compatibility when a key is
 * removed from the registry but still exists in the database.
 */
export function filterValidPermissions(raw: string[]): Permission[] {
  return raw.filter((k): k is Permission =>
    (ALL_PERMISSION_KEYS as string[]).includes(k),
  )
}
