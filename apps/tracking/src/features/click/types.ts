export interface TargetingData {
  country?: string
  device?: string
  browser?: string
}

export interface ClickMetadata {
  country: string | null
  browser: string | null
  os: string | null
  deviceType: string | null
}

export interface EvaluationResult {
  allowed: boolean
  matchedRuleId: string | null
  action: string | null
}

export interface MacroValues {
  "{tid}"?: string
  "{aff_id}"?: string
  "{offer_id}"?: string
  "{sub1}"?: string
  "{sub2}"?: string
  "{sub3}"?: string
  "{source}"?: string
  "{campaign}"?: string
  "{funnel}"?: string
}
