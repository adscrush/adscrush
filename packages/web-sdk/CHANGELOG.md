# AdsCrush Web SDK - CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-08-01

### Added
- **`keymapping`** - Map URL parameters on the current page to SDK fields for both `trackConversion()` and `trackLead()` (e.g. `['sub1:aff_sub1', 'coupon:promo']`). Explicitly provided values always win. Configurable globally via `init()`/`window.adscrushConfig` or per call. This mirrors the keymapping concept from affiliate-network SDKs so media buyers can pass network sub-parameters through tracking links without extra code.

### Improved
- **`getUrlParam()` / `parseKeymapping()` / `applyKeymapping()`** - Extracted reusable, tested helpers in `src/utils.ts`; `extractClickIdFromUrl()` now delegates to `getUrlParam()`.

---

## [1.1.1] - 2026-08-01

### Added
- **`trackLead(options)`** - Track lead submissions (name, phone, email) via pixel, iframe, or postback.
- **Shared `domain` config** - A single `domain` option in `init()`/`window.adscrushConfig` now drives **both** `trackConversion()` and `trackLead()`, with per-call overrides supported. Domains are normalized to a canonical base URL (bare hostnames → `https://`).

### Improved
- **Production-grade domain resolution** - Extracted a shared `normalizeTrackingDomain` helper (`src/utils.ts`) and a single `resolveTrackingDomain` precedence chain (per-call > init config > default) used by both tracking methods. Eliminated duplicated normalization logic.
- **Constants** - `init()` now uses `DEFAULT_PARAM_NAME` / `DEFAULT_COOKIE_EXPIRY` instead of inline literals.
- **Docs** - README documents the `domain` config, `trackLead()`, and per-call domain overrides.

---

## [1.1.0] - 2026-07-23

### Added
- **`destroy()` method** - Fully reset SDK back to uninitialized state. Clears all stored data, configuration, and resets initialization. Call `init()` again to reinitialize.

### Fixed
- **`initializeConversion()` now accepts direct click ID values** - The function now detects whether the argument is a URL parameter name (captures from URL) or a direct click ID value (stores immediately). Previously it only treated the argument as a URL parameter name, despite documentation saying otherwise.
- **Critical syntax error** - Fixed stray closing brace (`}`) that caused `TS1128` syntax error, preventing the entire SDK from loading.
- **Missing `jsdom` dependency** - Added `jsdom` as devDependency so tests can execute.

### Improved
- **Test quality**:
  - Added `destroy()` to before each test for clean slate
  - Replaced real `setTimeout` with `vi.useFakeTimers()` for deterministic tests
  - Added `afterEach` cleanup for `global.Image` mock (prevents cross-test pollution)
  - Fixed misleading test name "should fail if SDK not initialized" → proper tests using `destroy()`

---

## [1.0.0] - 2026-07-23

### Added
- **Core SDK functionality**
  - Automatic click ID (`tid`) capture from URL parameters
  - Smart storage with Cookie → localStorage → memory fallback
  - Three tracking methods: pixel (default), iframe, and postback
  - Goal-based conversion tracking with custom event names
  - Built-in client-side and server-side deduplication
  - Debug mode with detailed console logging
  
- **TypeScript support**
  - Full type definitions for all public APIs
  - Comprehensive interfaces for configuration and options
  
- **Multiple build formats**
  - ESM (index.mjs) for modern bundlers
  - CommonJS (index.js) for Node.js and older bundlers
  - IIFE (index.iife.min.js) for direct browser use
  - Minified and tree-shakeable
  
- **API methods**
  - `init(config)` - Initialize SDK with tracking domain
  - `trackConversion(options?)` - Track conversion events
  - `getClickId()` - Retrieve current click ID
  - `setClickId(clickId)` - Manually set click ID
  - `hasTrackedConversion(event?)` - Check if event already tracked
  - `clear()` - Clear all stored data
  - `setDebug(enabled)` - Toggle debug mode
  - `getConfig()` - Get current configuration
  
- **Configuration options**
  - `domain` (required) - Tracking domain
  - `cookieDomain` - Cross-subdomain tracking support
  - `cookieExpiry` - Cookie lifetime in days (default: 30)
  - `paramName` - Custom URL parameter name (default: 'tid')
  - `debug` - Enable debug logging
  - `autoInit` - Auto-capture click ID on load (default: true)
  
- **Conversion options**
  - `event` - Event name (e.g., 'purchase', 'signup', 'lead')
  - `saleAmount` - Customer paid amount
  - `payout` - Your commission/payout
  - `currency` - Currency code (default: 'USD')
  - `coupon` - Coupon/promo code
  - `advSub1-5` - Custom parameters for metadata
  - `method` - Tracking method: 'pixel', 'iframe', or 'postback'
  - `clickId` - Override click ID
  - `domain` - Override tracking domain
  - `onSuccess` - Success callback
  - `onError` - Error callback
  
- **Documentation**
  - Comprehensive README with usage examples
  - INTEGRATION.md with framework-specific guides
  - ARCHITECTURE.md with technical details
  - EXAMPLES.md with real-world scenarios
  
- **Testing**
  - Unit tests with Vitest
  - Browser environment simulation
  - Coverage for core functionality

### Notes
- Designed for AdsCrush platform architecture (Campaign + Funnel model)
- Compatible with modern browsers and IE11 with polyfills
- Server-side encryption of PII data (IP, User-Agent)
- GDPR/CCPA compliant with proper consent management

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] Server-side rendering (SSR) support for Next.js/Nuxt
- [ ] React hooks package (`@adscrush/react`)
- [ ] Vue composables package (`@adscrush/vue`)
- [ ] Enhanced error tracking and reporting
- [ ] Retry logic for failed tracking requests
- [ ] Queue system for offline tracking
- [ ] Performance monitoring integration

### [1.2.0] - Planned
- [ ] A/B testing integration
- [ ] Real-time event streaming
- [ ] Advanced attribution models
- [ ] Multi-touch attribution support
- [ ] Cross-device tracking
- [ ] Enhanced privacy controls

### [2.0.0] - Planned
- [ ] Web Components support
- [ ] Native mobile SDK bridges
- [ ] GraphQL API support
- [ ] Enhanced analytics dashboard
- [ ] Custom event schemas
- [ ] Webhook notifications

---

## Migration Guide

### From Original SDK

If you're migrating from the original minimal SDK:

**Before:**
```javascript
import { init, trackConversion } from '@adscrush/web-sdk'

init({ domain: 'track.example.com' })

await trackConversion({
  offerId: 'offer_123', // Not used in new version
  conversionData: {
    event: 'purchase',
    payout: '15.00',
    saleAmount: '99.99'
  }
})
```

**After:**
```javascript
import AdsCrushSDK from '@adscrush/web-sdk'

AdsCrushSDK.init({ domain: 'track.example.com' })

await AdsCrushSDK.trackConversion({
  event: 'purchase',
  payout: '15.00',
  saleAmount: '99.99'
})
```

**Key Changes:**
- Default export is now the SDK object
- `conversionData` flattened into main options
- `offerId` removed (use campaign tracking links instead)
- Added `method` option for pixel/iframe/postback
- Added callbacks: `onSuccess`, `onError`
- Added deduplication checks
- Added debug mode

---

## Support

For questions, issues, or feature requests:
- GitHub Issues: [github.com/your-org/adscrush](https://github.com)
- Email: support@adscrush.com
- Documentation: See README.md and INTEGRATION.md
