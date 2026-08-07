/**
 * Standard Tracking Tokens
 * These are the query parameters usually sent in the tracking URL
 */
export const STANDARD_TRACKING_TOKENS = [
  { label: "aff_click_id", placeholder: "{replace_it}" },
  { label: "sub_aff_id", placeholder: "{replace_it}" },
  { label: "aff_sub1", placeholder: "{replace_it}" },
  { label: "aff_sub2", placeholder: "{replace_it}" },
  { label: "aff_sub3", placeholder: "{replace_it}" },
  { label: "aff_sub4", placeholder: "{replace_it}" },
  { label: "aff_sub5", placeholder: "{replace_it}" },
  { label: "aff_sub6", placeholder: "{replace_it}" },
  { label: "aff_sub7", placeholder: "{replace_it}" },
  { label: "aff_sub8", placeholder: "{replace_it}" },
  { label: "aff_sub9", placeholder: "{replace_it}" },
  { label: "aff_sub10", placeholder: "{replace_it}" },
  { label: "utm_source", placeholder: "{replace_it}" },
  { label: "utm_medium", placeholder: "{replace_it}" },
  { label: "utm_campaign", placeholder: "{replace_it}" },
  { label: "utm_term", placeholder: "{replace_it}" },
  { label: "utm_content", placeholder: "{replace_it}" },
] as const

/**
 * Additional Macros
 * These are system-wide placeholders that are replaced during redirect flow
 */
export const ADDITIONAL_MACROS = [
  { label: "{tid}", placeholder: "System Click/Transaction ID (UUID)" },
  { label: "{click_id}", placeholder: "Click ID" },
  { label: "{product_id}", placeholder: "Product ID" },
  { label: "{adv_id}", placeholder: "Advertiser ID" },
  { label: "{creative_id}", placeholder: "Creative ID" },
  { label: "{payout}", placeholder: "Payout Amount" },
  { label: "{revenue}", placeholder: "Revenue Amount" },
  { label: "{currency}", placeholder: "Currency" },
  { label: "{event}", placeholder: "Goal Event Name" },
  { label: "{status}", placeholder: "Conversion Status" },
  { label: "{sale_amount}", placeholder: "Sale Amount" },
  { label: "{sub1}", placeholder: "Sub 1" },
  { label: "{sub2}", placeholder: "Sub 2" },
  { label: "{sub3}", placeholder: "Sub 3" },
  { label: "{sub4}", placeholder: "Sub 4" },
  { label: "{sub5}", placeholder: "Sub 5" },
  { label: "{sub6}", placeholder: "Sub 6" },
  { label: "{sub7}", placeholder: "Sub 7" },
  { label: "{sub8}", placeholder: "Sub 8" },
  { label: "{sub9}", placeholder: "Sub 9" },
  { label: "{sub10}", placeholder: "Sub 10" },
] as const

/**
 * URL Tokens
 * Consolidates tokens available for insertion into URL fields (Funnel URL, Landing Page URL)
 */
export const URL_TOKENS = [
  { label: "Transaction ID", value: "{tid}" },
  { label: "Campaign ID", value: "{campaign_id}" },
  { label: "Ad Account ID", value: "{ad_account_id}" },
  { label: "Media Buyer ID", value: "{media_buyer_id}" },
  { label: "Advertiser ID", value: "{adv_id}" },
  { label: "Product ID", value: "{product_id}" },
  { label: "Funnel ID", value: "{funnel_id}" },
  { label: "Creative ID", value: "{creative_id}" },
  { label: "Sub 1", value: "{sub1}" },
  { label: "Sub 2", value: "{sub2}" },
  { label: "Sub 3", value: "{sub3}" },
  { label: "Source", value: "{source}" },
] as const
