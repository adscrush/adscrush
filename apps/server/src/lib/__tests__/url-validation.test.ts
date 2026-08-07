import { describe, it, expect } from "vitest"
import { isPrivateAddress } from "../url-validation"

describe("isPrivateAddress", () => {
  it("detects loopback IPv4", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true)
    expect(isPrivateAddress("127.255.255.255")).toBe(true)
  })

  it("detects private IPv4 ranges (10.x.x.x)", () => {
    expect(isPrivateAddress("10.0.0.1")).toBe(true)
    expect(isPrivateAddress("10.255.255.255")).toBe(true)
  })

  it("detects private IPv4 ranges (172.16-31.x.x)", () => {
    expect(isPrivateAddress("172.16.0.1")).toBe(true)
    expect(isPrivateAddress("172.31.255.255")).toBe(true)
  })

  it("detects private IPv4 ranges (192.168.x.x)", () => {
    expect(isPrivateAddress("192.168.0.1")).toBe(true)
    expect(isPrivateAddress("192.168.255.255")).toBe(true)
  })

  it("detects link-local IPv4 (169.254.x.x)", () => {
    expect(isPrivateAddress("169.254.1.1")).toBe(true)
  })

  it("allows public IPv4 addresses", () => {
    expect(isPrivateAddress("8.8.8.8")).toBe(false)
    expect(isPrivateAddress("1.1.1.1")).toBe(false)
    expect(isPrivateAddress("104.16.16.40")).toBe(false)
  })

  it("detects loopback IPv6", () => {
    expect(isPrivateAddress("::1")).toBe(true)
  })

  it("detects private IPv6 ranges", () => {
    expect(isPrivateAddress("fc00::1")).toBe(true)
    expect(isPrivateAddress("fdff::1")).toBe(true)
  })

  it("handles invalid IPs gracefully", () => {
    expect(isPrivateAddress("not-an-ip")).toBe(false)
    expect(isPrivateAddress("")).toBe(false)
  })
})

// Note: validateUploadUrl requires DNS resolution which is not available in
// the test environment. Integration tests for it would need a running network.
// The unit-tested isPrivateAddress covers the core security logic.
