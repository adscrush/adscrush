import type { ConversionResponse } from "./types.js"
import { normalizeTrackingDomain } from "./utils.js"

interface SendConversionParams {
  domain: string
  params: URLSearchParams
  method: "pixel" | "iframe" | "postback"
}

/**
 * Send conversion via pixel (1x1 image)
 * Most compatible method, works everywhere
 */
function sendPixel(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve()
      return
    }

    const img = new Image(1, 1)
    img.onload = () => resolve()
    img.onerror = () => resolve() // Still resolve on error - request was sent

    // Prevent caching
    const timestamp = Date.now()
    img.src = `${url}&_t=${timestamp}`
  })
}

/**
 * Send conversion via hidden iframe
 * Better for cross-domain tracking
 */
function sendIframe(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve()
      return
    }

    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    iframe.style.width = "1px"
    iframe.style.height = "1px"
    iframe.style.position = "absolute"
    iframe.style.left = "-9999px"

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }, 100)
      resolve()
    }

    iframe.onload = cleanup
    iframe.onerror = cleanup

    document.body.appendChild(iframe)

    // Prevent caching
    const timestamp = Date.now()
    iframe.src = `${url}&_t=${timestamp}`

    // Timeout fallback
    setTimeout(cleanup, 5000)
  })
}

/**
 * Send conversion via POST request (direct API call)
 * Requires CORS to be configured on tracking server
 */
async function sendPostback(url: string, params: URLSearchParams): Promise<ConversionResponse> {
  try {
    const body: Record<string, string> = {}
    params.forEach((value, key) => {
      body[key] = value
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data as ConversionResponse
  } catch (error) {
    throw new Error(
      `Postback failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Send conversion using the specified method
 */
export async function sendConversion(
  params: SendConversionParams
): Promise<ConversionResponse> {
  const { domain, params: queryParams, method } = params
  const baseUrl = normalizeTrackingDomain(domain)

  try {
    if (method === "postback") {
      const url = `${baseUrl}/conversion/track`
      return await sendPostback(url, queryParams)
    }

    // Pixel and iframe go to /conversion/pixel (GET endpoint)
    const pixelUrl = `${baseUrl}/conversion/pixel?${queryParams.toString()}`

    // Append method so the tracking server can distinguish iframe vs pixel
    const methodUrl = method === "iframe" ? `${pixelUrl}&method=iframe` : `${pixelUrl}&method=pixel`

    if (method === "iframe") {
      await sendIframe(methodUrl)
    } else {
      await sendPixel(methodUrl)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Send lead via pixel or postback
 */
export async function sendLead(
  params: SendConversionParams
): Promise<ConversionResponse> {
  const { domain, params: queryParams, method } = params
  const baseUrl = normalizeTrackingDomain(domain)

  try {
    if (method === "postback") {
      const url = `${baseUrl}/lead/postback`
      return await sendPostback(url, queryParams)
    }

    const pixelUrl = `${baseUrl}/lead/pixel?${queryParams.toString()}`

    if (method === "iframe") {
      await sendIframe(`${pixelUrl}&method=iframe`)
    } else {
      await sendPixel(`${pixelUrl}&method=pixel`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
