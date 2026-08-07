# @adscrush/web-sdk

[![npm version](https://img.shields.io/npm/v/@adscrush/web-sdk.svg)](https://www.npmjs.com/package/@adscrush/web-sdk)
[![npm downloads](https://img.shields.io/npm/dm/@adscrush/web-sdk.svg)](https://www.npmjs.com/package/@adscrush/web-sdk)
[![license](https://img.shields.io/npm/l/@adscrush/web-sdk.svg)](https://github.com/adscrush/adscrush/blob/main/packages/web-sdk/LICENSE)

Official JavaScript SDK for AdsCrush conversion tracking.

## Installation

### CDN (Recommended)

Add this script to your page's `<head>` tag:

```html
<head>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
</head>
```

### NPM

```bash
npm install @adscrush/web-sdk
```

## Usage

### Landing Page (Capture Click ID)

```html
<head>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
</head>
```

The SDK auto-initializes and captures the click ID from the `tid` URL parameter.

### Thank You Page (Track Conversion)

```html
<head>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
  
  <script>
    AdsCrushSDK.trackConversion({
      conversionData: {
        event: 'purchase',
        saleAmount: '99.99',
        payout: '15.00',
        currency: 'USD'
      }
    })
  </script>
</head>
```

### Custom Tracking Domain

By default the SDK posts to `track.adscrush.com`. If you use a custom tracking
domain (e.g. a branded subdomain or a self-hosted tracking server), set it once in
`window.adscrushConfig` — it is used by **both** `trackConversion()` and
`trackLead()` (a per-call `domain` option overrides it):

```html
<head>
  <script>
    window.adscrushConfig = {
      domain: 'track.yourdomain.com'
    }
  </script>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
</head>
```

Bare hostnames are normalized to `https://`; full URLs (`http://` or `https://`)
are used as-is (trailing slashes are stripped).

### Custom Parameter Name

If your tracking links use a different parameter name (e.g., `clickid` instead of `tid`):

```html
<head>
  <script>
    window.adscrushConfig = {
      paramName: 'clickid'
    }
  </script>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
</head>
```

### Set Click ID Directly

If you have the click ID from another source (e.g., a URL you constructed or a server-side redirect):

```html
<head>
  <script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
  
  <script>
    AdsCrushSDK.setClickId('abc-123-def-456')
  </script>
</head>
```

## API Reference

### `trackConversion(options)`

Track a conversion event.

**Parameters:**
- `conversionData` - Object containing conversion details
  - `event` - Event name (default: "conversion")
  - `saleAmount` - Sale amount
  - `payout` - Payout amount
  - `currency` - Currency code (e.g., "USD")
  - `coupon` - Coupon code
  - `advSub1` through `advSub5` - Custom tracking parameters
- `method` - Tracking method: "pixel" (default), "iframe", or "postback"
- `clickId` - Override click ID
- `domain` - Per-call tracking domain override (defaults to the `domain` from `init()` config)
- `onSuccess` - Success callback
- `onError` - Error callback

### `trackLead(options)`

Track a lead submission (name, phone, email).

```javascript
AdsCrushSDK.trackLead({
  name: 'John Doe',
  phone: '+1 555-0100',
  email: 'john@example.com',
  payout: '5.00',
  currency: 'USD'
})
```

**Parameters:**
- `name` - Lead name
- `phone` - Lead phone number
- `email` - Lead email address
- `sub1` through `sub5` - Custom sub-fields
- `payout` - Payout amount
- `currency` - Currency code (e.g., "USD")
- `method` - Tracking method: "pixel" (default), "iframe", or "postback"
- `clickId` - Override click ID
- `domain` - Per-call tracking domain override (defaults to the `domain` from `init()` config)
- `onSuccess` - Success callback
- `onError` - Error callback

### `getClickId()`

Get the current click ID.

**Returns:** `string | null`

### `setClickId(clickId)`

Manually set the click ID and store it in cookies/localStorage.

```javascript
AdsCrushSDK.setClickId('abc-123-def-456')
```

**Parameters:**
- `clickId` - The click ID to store

**Returns:** `void`

### `hasTrackedConversion(event?)`

Check if a conversion has been tracked.

**Parameters:**
- `event` - Event name (default: "conversion")

**Returns:** `boolean`

### `destroy()`

Fully reset the SDK back to uninitialized state. Clears all stored data, configuration, and resets initialization. Call `init()` again after this to reinitialize.

```javascript
AdsCrushSDK.destroy()
```

**Returns:** `void`

### `clear()`

Clear all stored data (click ID and deduplication flags). The SDK remains initialized.

### `setDebug(enabled)`

Enable/disable debug logging.

## Configuration

Pass configuration via `window.adscrushConfig`:

```javascript
window.adscrushConfig = {
  domain: 'track.adscrush.com', // Tracking domain (default: 'track.adscrush.com')
  paramName: 'tid',             // URL parameter name (default: 'tid')
  cookieExpiry: 30,             // Cookie expiration in days (default: 30)
  cookieDomain: '.example.com', // Cookie domain for cross-subdomain tracking
  debug: false,                 // Enable debug logging (default: false)
  autoInit: true,               // Auto-capture click ID on load (default: true)
  keymapping: ['sub1:aff_sub1'] // Map URL params to SDK fields (see below)
}
```

### Key Mapping

`keymapping` maps URL parameters on the current page to SDK fields, so values
you pass through your links are captured automatically. It is used by **both**
`trackConversion()` and `trackLead()`. Explicitly provided values always win
over keymapped values.

```javascript
AdsCrushSDK.trackLead({
  name: 'John Doe',
  keymapping: ['sub1:aff_sub1', 'sub2:utm_campaign']
})
// → sub1 filled from ?aff_sub1=..., sub2 from ?utm_campaign=...
```

The format is `'<sdkField>:<urlParam>'`. Conversion fields: `advSub1`–`advSub5`,
`coupon`, `currency`, `event`, `saleAmount`, `payout`. Lead fields: `name`,
`phone`, `email`, `sub1`–`sub5`, `payout`, `currency`.

## Examples

### E-commerce

```javascript
AdsCrushSDK.trackConversion({
  conversionData: {
    event: 'purchase',
    saleAmount: '149.99',
    payout: '22.50',
    currency: 'USD',
    advSub1: 'order_12345'
  }
})
```

### Lead Generation

```javascript
AdsCrushSDK.trackLead({
  name: 'John Doe',
  phone: '+1 555-0100',
  email: 'john@example.com',
  payout: '5.00',
  sub1: 'form_submission'
})
```

### Multi-Step Funnel

```javascript
// Step 1: Landing page visit (auto-captured)

// Step 2: Sign up
AdsCrushSDK.trackConversion({
  conversionData: {
    event: 'signup',
    payout: '2.00'
  }
})

// Step 3: Purchase
AdsCrushSDK.trackConversion({
  conversionData: {
    event: 'purchase',
    saleAmount: '99.99',
    payout: '15.00'
  }
})
```

## TypeScript

Full TypeScript support with type definitions included.

```typescript
import AdsCrushSDK, { ConversionOptions } from '@adscrush/web-sdk'

const options: ConversionOptions = {
  conversionData: {
    event: 'purchase',
    saleAmount: '99.99',
    payout: '15.00',
    currency: 'USD'
  }
}

await AdsCrushSDK.trackConversion(options)
```

## License

MIT
