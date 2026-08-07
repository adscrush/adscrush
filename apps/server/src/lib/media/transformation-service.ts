import {
  TRANSFORM_PRESETS,
  type TransformPreset,
  type TransformMode,
} from "@adscrush/shared/validators/media.schema"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransformOptions {
  width?: number // 1-5000
  height?: number // 1-5000
  mode?: TransformMode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_DIMENSION = 1
const MAX_DIMENSION = 5000

/**
 * Maps our mode names to Bunny.net image processing query parameter values.
 * Bunny.net uses `aspect_ratio` param with specific values for resize behavior.
 */
const MODE_TO_BUNNY_PARAM: Record<TransformMode, string> = {
  crop: "crop",
  stretch: "stretch",
  contain: "contain",
  cover: "cover",
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class TransformationService {
  /**
   * Builds a CDN URL with Bunny.net image processing query parameters
   * for the specified transformation options.
   *
   * @throws Error if dimensions are outside the valid range [1, 5000]
   */
  buildTransformUrl(cdnUrl: string, options: TransformOptions): string {
    this.validateOptions(options)

    const params = new URLSearchParams()

    if (options.width !== undefined) {
      params.set("width", String(options.width))
    }

    if (options.height !== undefined) {
      params.set("height", String(options.height))
    }

    if (options.mode !== undefined) {
      params.set("aspect_ratio", MODE_TO_BUNNY_PARAM[options.mode])
    }

    const queryString = params.toString()
    if (!queryString) {
      return cdnUrl
    }

    // Handle URLs that may already have query parameters
    const separator = cdnUrl.includes("?") ? "&" : "?"
    return `${cdnUrl}${separator}${queryString}`
  }

  /**
   * Builds a CDN URL using a predefined transformation preset.
   * For the "original" preset, returns the CDN URL unchanged.
   */
  buildPresetUrl(cdnUrl: string, preset: TransformPreset): string {
    const presetOptions = TRANSFORM_PRESETS[preset]

    // "original" preset has no options — return URL as-is
    if (!presetOptions || Object.keys(presetOptions).length === 0) {
      return cdnUrl
    }

    return this.buildTransformUrl(cdnUrl, presetOptions as TransformOptions)
  }

  /**
   * Validates that dimension values are within the allowed range [1, 5000].
   */
  private validateOptions(options: TransformOptions): void {
    if (options.width !== undefined) {
      if (
        !Number.isInteger(options.width) ||
        options.width < MIN_DIMENSION ||
        options.width > MAX_DIMENSION
      ) {
        throw new Error(
          `Invalid width: ${options.width}. Must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}.`,
        )
      }
    }

    if (options.height !== undefined) {
      if (
        !Number.isInteger(options.height) ||
        options.height < MIN_DIMENSION ||
        options.height > MAX_DIMENSION
      ) {
        throw new Error(
          `Invalid height: ${options.height}. Must be an integer between ${MIN_DIMENSION} and ${MAX_DIMENSION}.`,
        )
      }
    }
  }
}
