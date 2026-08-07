import { customAlphabet } from "nanoid"

const prefixes = {
  log: "log",
  advertiser: "adv",
  employee: "emp",
  conversion: "cnv",
  landing_page: "lp",

  // auth ids
  user: "usr",
  session: "ses",
  account: "act",
  verification: "vrf",

  member: "mem",
  invitation: "inv",
  two_factor: "tfa",

  // new crm tables
  media_buyer: "mb",
  product: "prd",
  campaign: "cmp",
  ad_account: "aac",
  ad_account_spend: "aas",
  creative: "crt",
  creative_file: "cf",
  creative_note: "crn",
  creative_tag: "ctg",
  setting: "set",

  // redesigned tables
  click: "clk",
  department: "dpt",
  category: "cat",
  category_metafield: "cmf",
  product_metafield_value: "pmv",
  product_media: "pmg",
  folder: "fld",
  media_folder: "mfld",
  media_file: "mfl",

  // new operational tables
  audit_log: "aud",
  daily_stat: "dst",
  tid_lookup: "tlk",
  retention_policy: "rtp",
  pii_key_version: "pkv",

  // funnel
  funnel: "fun",
} as const

interface GenerateIdOptions {
  length?: number
  separator?: string
}

export function generateId(
  prefixOrOptions?: keyof typeof prefixes | GenerateIdOptions,
  inputOptions: GenerateIdOptions = {}
) {
  const finalOptions =
    typeof prefixOrOptions === "object" ? prefixOrOptions : inputOptions

  const prefix =
    typeof prefixOrOptions === "object" ? undefined : prefixOrOptions

  const { length = 12, separator = "_" } = finalOptions
  const id = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    length
  )()

  return prefix && prefix in prefixes
    ? `${prefixes[prefix]}${separator}${id}`
    : id
}
