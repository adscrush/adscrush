import { describe, expect, it } from "vitest"
import { TransformationService } from "./transformation-service"

const service = new TransformationService()
const BASE_URL = "https://cdn.example.com/media/image.jpg"

describe("TransformationService", () => {
  describe("buildTransformUrl", () => {
    it("appends width query parameter", () => {
      const result = service.buildTransformUrl(BASE_URL, { width: 300 })
      expect(result).toBe(`${BASE_URL}?width=300`)
    })

    it("appends height query parameter", () => {
      const result = service.buildTransformUrl(BASE_URL, { height: 400 })
      expect(result).toBe(`${BASE_URL}?height=400`)
    })

    it("appends width and height query parameters", () => {
      const result = service.buildTransformUrl(BASE_URL, { width: 300, height: 400 })
      expect(result).toBe(`${BASE_URL}?width=300&height=400`)
    })

    it("appends mode as aspect_ratio query parameter", () => {
      const result = service.buildTransformUrl(BASE_URL, { width: 150, height: 150, mode: "crop" })
      expect(result).toBe(`${BASE_URL}?width=150&height=150&aspect_ratio=crop`)
    })

    it("supports all mode values", () => {
      const modes = ["crop", "stretch", "contain", "cover"] as const
      for (const mode of modes) {
        const result = service.buildTransformUrl(BASE_URL, { width: 100, mode })
        expect(result).toContain(`aspect_ratio=${mode}`)
      }
    })

    it("returns original URL when no options are provided", () => {
      const result = service.buildTransformUrl(BASE_URL, {})
      expect(result).toBe(BASE_URL)
    })

    it("handles URLs that already have query parameters", () => {
      const urlWithParams = `${BASE_URL}?token=abc`
      const result = service.buildTransformUrl(urlWithParams, { width: 200 })
      expect(result).toBe(`${urlWithParams}&width=200`)
    })

    it("validates minimum dimension (width = 0 throws)", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { width: 0 })).toThrow(
        /Invalid width.*Must be an integer between 1 and 5000/,
      )
    })

    it("validates minimum dimension (height = 0 throws)", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { height: 0 })).toThrow(
        /Invalid height.*Must be an integer between 1 and 5000/,
      )
    })

    it("validates maximum dimension (width = 5001 throws)", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { width: 5001 })).toThrow(
        /Invalid width.*Must be an integer between 1 and 5000/,
      )
    })

    it("validates maximum dimension (height = 5001 throws)", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { height: 5001 })).toThrow(
        /Invalid height.*Must be an integer between 1 and 5000/,
      )
    })

    it("rejects negative dimensions", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { width: -1 })).toThrow(/Invalid width/)
      expect(() => service.buildTransformUrl(BASE_URL, { height: -10 })).toThrow(/Invalid height/)
    })

    it("rejects non-integer dimensions", () => {
      expect(() => service.buildTransformUrl(BASE_URL, { width: 100.5 })).toThrow(/Invalid width/)
      expect(() => service.buildTransformUrl(BASE_URL, { height: 200.7 })).toThrow(/Invalid height/)
    })

    it("accepts boundary values (1 and 5000)", () => {
      const result1 = service.buildTransformUrl(BASE_URL, { width: 1, height: 1 })
      expect(result1).toContain("width=1")
      expect(result1).toContain("height=1")

      const result5000 = service.buildTransformUrl(BASE_URL, { width: 5000, height: 5000 })
      expect(result5000).toContain("width=5000")
      expect(result5000).toContain("height=5000")
    })
  })

  describe("buildPresetUrl", () => {
    it("generates thumbnail preset (150x150 crop)", () => {
      const result = service.buildPresetUrl(BASE_URL, "thumbnail")
      expect(result).toBe(`${BASE_URL}?width=150&height=150&aspect_ratio=crop`)
    })

    it("generates small preset (300x300 contain)", () => {
      const result = service.buildPresetUrl(BASE_URL, "small")
      expect(result).toBe(`${BASE_URL}?width=300&height=300&aspect_ratio=contain`)
    })

    it("generates medium preset (600x600 contain)", () => {
      const result = service.buildPresetUrl(BASE_URL, "medium")
      expect(result).toBe(`${BASE_URL}?width=600&height=600&aspect_ratio=contain`)
    })

    it("generates large preset (1200x1200 contain)", () => {
      const result = service.buildPresetUrl(BASE_URL, "large")
      expect(result).toBe(`${BASE_URL}?width=1200&height=1200&aspect_ratio=contain`)
    })

    it("returns original URL unchanged for 'original' preset", () => {
      const result = service.buildPresetUrl(BASE_URL, "original")
      expect(result).toBe(BASE_URL)
    })
  })
})
