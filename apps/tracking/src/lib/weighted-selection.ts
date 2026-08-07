/**
 * Weighted Selection Utility
 *
 * Implements weighted random selection for landing pages based on their weight values.
 * Uses a normalized probability distribution for fair selection.
 */

export interface WeightedItem {
  weight: number | null
}

/**
 * Selects a random item from an array based on weights.
 *
 * Algorithm:
 * 1. Filters out items with weight = 0 (disabled)
 * 2. Normalizes weights to handle null values
 * 3. Calculates cumulative distribution
 * 4. Generates random number and selects based on probability
 *
 * Weight Handling:
 * - null = Auto (equal distribution with other null/positive weights)
 * - 0 = Disabled (excluded from selection entirely)
 * - Positive numbers = Weighted distribution
 * - Negative numbers = Treated as 0 (disabled)
 *
 * @example
 * ```ts
 * const items = [
 *   { id: 'lp1', weight: 100 },  // 50% chance
 *   { id: 'lp2', weight: 100 },  // 50% chance
 *   { id: 'lp3', weight: 0 }     // Never selected (disabled)
 * ]
 * const selected = selectByWeight(items)
 * ```
 */
export function selectByWeight<T extends WeightedItem>(items: T[]): T | null {
  if (items.length === 0) {
    return null
  }

  // Filter out disabled items (weight = 0 or negative)
  const enabledItems = items.filter((item) => {
    const weight = item.weight ?? 1 // null = auto (treated as 1)
    return weight > 0
  })

  if (enabledItems.length === 0) {
    return null // All items disabled
  }

  if (enabledItems.length === 1) {
    return enabledItems[0] ?? null
  }

  // Normalize weights: null becomes 1 (auto/equal distribution)
  const normalizedWeights = enabledItems.map((item) => {
    return item.weight ?? 1
  })

  // Calculate total weight
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0)

  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight

  // Select item based on cumulative weight
  let cumulativeWeight = 0
  for (let i = 0; i < enabledItems.length; i++) {
    const weight = normalizedWeights[i]
    if (weight === undefined) continue

    cumulativeWeight += weight
    if (random < cumulativeWeight) {
      const selectedItem = enabledItems[i]
      return selectedItem ?? null
    }
  }

  // Fallback (should never reach here due to floating point precision)
  const lastItem = enabledItems[enabledItems.length - 1]
  return lastItem ?? null
}

/**
 * Calculates the selection probability for each item based on weights
 *
 * Useful for debugging and understanding weight distribution
 *
 * @returns Array of probabilities (0-1) corresponding to input items
 */
export function calculateProbabilities<T extends WeightedItem>(items: T[]): number[] {
  if (items.length === 0) {
    return []
  }

  if (items.length === 1) {
    return [1]
  }

  // Filter out disabled items first
  const enabledItems = items.filter((item) => {
    const weight = item.weight ?? 1
    return weight > 0
  })

  if (enabledItems.length === 0) {
    return items.map(() => 0)
  }

  // Normalize weights
  const normalizedWeights = enabledItems.map((item) => {
    return item.weight ?? 1
  })

  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0)

  // Map back to original array
  return items.map((item) => {
    const weight = item.weight ?? 1
    if (weight <= 0) return 0 // Disabled items have 0 probability
    return weight / totalWeight
  })
}

/**
 * Validates weight distribution and returns warnings if any
 */
export function validateWeights<T extends WeightedItem>(items: T[]): string[] {
  const warnings: string[] = []

  if (items.length === 0) {
    warnings.push("No items to select from")
    return warnings
  }

  const enabledItems = items.filter((item) => {
    const weight = item.weight ?? 1
    return weight > 0
  })

  if (enabledItems.length === 0) {
    warnings.push("All items are disabled (weight = 0 or negative)")
  }

  const zeroWeightCount = items.filter((item) => item.weight === 0).length
  if (zeroWeightCount > 0) {
    warnings.push(`${zeroWeightCount} items are disabled (weight = 0)`)
  }

  const negativeWeights = items.filter((item) => (item.weight ?? 0) < 0)
  if (negativeWeights.length > 0) {
    warnings.push(`${negativeWeights.length} items have negative weights (treated as disabled)`)
  }

  return warnings
}
