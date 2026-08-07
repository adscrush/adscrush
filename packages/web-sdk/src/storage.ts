import type { StorageAdapter } from "./types.js"
import { CLICK_ID_KEY, DEDUP_KEY_PREFIX } from "./config.js"

/**
 * Cookie-based storage adapter
 */
class CookieStorage implements StorageAdapter {
  private domain: string | undefined

  constructor(domain?: string) {
    this.domain = domain
  }

  get(key: string): string | null {
    if (typeof document === "undefined") return null

    const name = `${key}=`
    const cookies = document.cookie.split(";")

    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(name)) {
        return decodeURIComponent(cookie.substring(name.length))
      }
    }

    return null
  }

  set(key: string, value: string, expiryDays = 30): void {
    if (typeof document === "undefined") return

    const date = new Date()
    date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000)

    const expires = `expires=${date.toUTCString()}`
    const domain = this.domain ? `; domain=${this.domain}` : ""
    const path = "; path=/"
    const sameSite = "; SameSite=Lax"

    document.cookie = `${key}=${encodeURIComponent(value)}; ${expires}${domain}${path}${sameSite}`
  }

  remove(key: string): void {
    this.set(key, "", -1)
  }

  clear(): void {
    // Clear all adscrush-related cookies
    const cookies = typeof document !== "undefined" ? document.cookie.split(";") : []
    for (const cookie of cookies) {
      const name = cookie.split("=")[0]?.trim()
      if (name?.startsWith("adscrush_")) {
        this.remove(name)
      }
    }
  }

  setDomain(domain: string | undefined): void {
    this.domain = domain
  }
}

/**
 * LocalStorage fallback adapter
 */
class LocalStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return false
    }

    try {
      const test = "__adscrush_test__"
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  get(key: string): string | null {
    if (!this.isAvailable()) return null

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return null

      const parsed = JSON.parse(item)
      const now = Date.now()

      if (parsed.expiry && now > parsed.expiry) {
        this.remove(key)
        return null
      }

      return parsed.value
    } catch {
      return null
    }
  }

  set(key: string, value: string, expiryDays = 30): void {
    if (!this.isAvailable()) return

    try {
      const expiry = Date.now() + expiryDays * 24 * 60 * 60 * 1000
      window.localStorage.setItem(
        key,
        JSON.stringify({ value, expiry })
      )
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return
    window.localStorage.removeItem(key)
  }

  clear(): void {
    if (!this.isAvailable()) return

    try {
      const keys = Object.keys(window.localStorage)
      for (const key of keys) {
        if (key.startsWith("adscrush_")) {
          this.remove(key)
        }
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * In-memory storage fallback (when cookies and localStorage are unavailable)
 */
class MemoryStorage implements StorageAdapter {
  private store = new Map<string, { value: string; expiry?: number }>()

  get(key: string): string | null {
    const item = this.store.get(key)
    if (!item) return null

    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  set(key: string, value: string, expiryDays = 30): void {
    const expiry = Date.now() + expiryDays * 24 * 60 * 60 * 1000
    this.store.set(key, { value, expiry })
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    const keys = Array.from(this.store.keys())
    for (const key of keys) {
      if (key.startsWith("adscrush_")) {
        this.store.delete(key)
      }
    }
  }
}

/**
 * Smart storage manager with automatic fallback
 */
export class Storage {
  private adapter: StorageAdapter
  private cookieStorage: CookieStorage
  private localStorageAdapter: LocalStorageAdapter
  private memoryStorage: MemoryStorage

  constructor(cookieDomain?: string) {
    this.cookieStorage = new CookieStorage(cookieDomain)
    this.localStorageAdapter = new LocalStorageAdapter()
    this.memoryStorage = new MemoryStorage()

    // Try cookie first, then localStorage, then memory
    this.adapter = this.cookieStorage
  }

  setDomain(domain: string | undefined): void {
    this.cookieStorage.setDomain(domain)
  }

  get(key: string): string | null {
    // Try primary adapter
    let value = this.adapter.get(key)
    if (value) return value

    // Fallback to other adapters
    value = this.localStorageAdapter.get(key)
    if (value) return value

    return this.memoryStorage.get(key)
  }

  set(key: string, value: string, expiryDays?: number): void {
    // Write to all available adapters for redundancy
    try {
      this.adapter.set(key, value, expiryDays)
    } catch {
      // Fallback
    }

    try {
      this.localStorageAdapter.set(key, value, expiryDays)
    } catch {
      // Fallback
    }

    this.memoryStorage.set(key, value, expiryDays)
  }

  remove(key: string): void {
    this.adapter.remove(key)
    this.localStorageAdapter.remove(key)
    this.memoryStorage.remove(key)
  }

  clear(): void {
    this.adapter.clear()
    this.localStorageAdapter.clear()
    this.memoryStorage.clear()
  }
}


/**
 * Store click ID
 */
export function storeClickId(storage: Storage, clickId: string, expiry?: number): void {
  storage.set(CLICK_ID_KEY, clickId, expiry)
}

/**
 * Retrieve click ID
 */
export function retrieveClickId(storage: Storage): string | null {
  return storage.get(CLICK_ID_KEY)
}

/**
 * Set deduplication flag for a conversion event
 */
export function setDedupFlag(storage: Storage, clickId: string, event: string): void {
  const key = `${DEDUP_KEY_PREFIX}${clickId}_${event}`
  storage.set(key, "1", 365) // Keep for 1 year
}

/**
 * Check if conversion has been tracked (for deduplication)
 */
export function hasDedupFlag(storage: Storage, clickId: string, event: string): boolean {
  const key = `${DEDUP_KEY_PREFIX}${clickId}_${event}`
  return storage.get(key) === "1"
}
