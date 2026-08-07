import { describe, it, expect } from "vitest"
import {
  maskPhone,
  maskEmail,
  maskAddress,
  maskPincode,
  maskLeadPii,
} from "./mask"

describe("maskPhone", () => {
  it("returns null for null input", () => {
    expect(maskPhone(null)).toBeNull()
  })

  it("returns short strings unchanged", () => {
    expect(maskPhone("abc")).toBe("abc")
    expect(maskPhone("123")).toBe("123")
    expect(maskPhone("123456")).toBe("123456")
  })

  it("masks international format (+ prefix)", () => {
    const result = maskPhone("+919876543210")
    expect(result).toBe("+91******3210")
  })

  it("masks local format (no prefix)", () => {
    const result = maskPhone("9876543210")
    expect(result).toBe("987***3210")
  })

  it("preserves first 3 chars and last 4 chars", () => {
    const result = maskPhone("+15551234567")
    expect(result).toBe("+15*****4567")
  })

  it("returns 7 digit strings unchanged (no middle to hide)", () => {
    const result = maskPhone("1234567")
    expect(result).toBe("1234567")
  })
})

describe("maskEmail", () => {
  it("returns null for null input", () => {
    expect(maskEmail(null)).toBeNull()
  })

  it("returns email unchanged if no @ symbol", () => {
    expect(maskEmail("invalid")).toBe("invalid")
  })

  it("returns email unchanged if local part is 1 char", () => {
    expect(maskEmail("a@b.co")).toBe("a@b.co")
  })

  it("masks email with normal local part", () => {
    const result = maskEmail("john@example.com")
    expect(result).toBe("j***@example.com")
  })

  it("masks email with longer local part", () => {
    const result = maskEmail("verylongname@domain.com")
    expect(result).toBe("v***********@domain.com")
  })

  it("preserves full domain", () => {
    const result = maskEmail("user@sub.domain.co.uk")
    expect(result).toBe("u***@sub.domain.co.uk")
  })
})

describe("maskAddress", () => {
  it("returns null for null input", () => {
    expect(maskAddress(null)).toBeNull()
  })

  it("redacts a full street address", () => {
    const result = maskAddress("221B Baker Street")
    expect(result).toBe("********")
    expect(result).not.toContain("Baker")
  })

  it("uses a fixed-length redaction that leaks no length info", () => {
    expect(maskAddress("X")).toBe("********")
    expect(maskAddress("ABC")).toBe("********")
    expect(maskAddress("12345678901234567890")).toBe("********")
  })
})

describe("maskPincode", () => {
  it("returns null for null input", () => {
    expect(maskPincode(null)).toBeNull()
  })

  it("fully redacts a pincode", () => {
    expect(maskPincode("560001")).toBe("******")
    expect(maskPincode("123")).toBe("******")
  })
})

describe("maskLeadPii", () => {
  const lead = {
    id: "lead_1",
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com",
    address: "221B Baker Street",
    pincode: "560001",
    city: "Bengaluru",
    state: "Karnataka",
  }

  it("returns the lead unchanged when caller can view sensitive data", () => {
    expect(maskLeadPii(lead, true)).toEqual(lead)
  })

  it("masks phone, email, address, and pincode for non-sensitive viewers", () => {
    const result = maskLeadPii(lead, false)
    expect(result.phone).toBe("987***3210")
    expect(result.email).toBe("j***@example.com")
    expect(result.address).not.toContain("Baker")
    expect(result.pincode).toBe("******")
  })

  it("keeps non-contact fields (name, city, state) intact", () => {
    const result = maskLeadPii(lead, false)
    expect(result.name).toBe("John Doe")
    expect(result.city).toBe("Bengaluru")
    expect(result.state).toBe("Karnataka")
    expect(result.id).toBe("lead_1")
  })

  it("handles null contact fields", () => {
    const result = maskLeadPii(
      { id: "lead_2", name: null, phone: null, email: null, address: null, pincode: null },
      false
    )
    expect(result.phone).toBeNull()
    expect(result.email).toBeNull()
    expect(result.address).toBeNull()
    expect(result.pincode).toBeNull()
  })

  it("passes through extra fields", () => {
    const result = maskLeadPii({ ...lead, payout: "25.00", status: "pending" }, false)
    expect(result.payout).toBe("25.00")
    expect(result.status).toBe("pending")
  })
})
