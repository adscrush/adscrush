# Deploying SDK to Cloudflare Pages

Your SDK is now configured to be hosted at `https://sdk.adscrush.com` on Cloudflare Pages.

## Quick Deploy

### Step 1: Prepare Build

```bash
cd packages/web-sdk
pnpm build
```

This creates the `dist/` folder with:
- `index.iife.min.js` - Main SDK file
- `index.mjs` - ESM version
- `index.js` - CommonJS version
- Type definitions

### Step 2: Create Cloudflare Pages Structure

```bash
# Create deployment folder
mkdir -p deploy/v1

# Copy built files
cp dist/index.iife.min.js deploy/v1/
cp dist/index.iife.min.js.map deploy/v1/
cp dist/index.mjs deploy/v1/
cp dist/index.js deploy/v1/
cp dist/*.d.ts deploy/v1/

# Optional: Copy for root access
cp dist/index.iife.min.js deploy/sdk.js
```

### Step 3: Add _headers for CORS

Create `deploy/_headers`:

```
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable
```

### Step 4: Deploy to Cloudflare Pages

#### Option A: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd deploy
wrangler pages deploy . --project-name=adscrush-sdk
```

#### Option B: Git Integration

1. Push `deploy/` folder to a Git repository
2. Connect repository to Cloudflare Pages
3. Set build settings:
   - Build command: `pnpm --filter @adscrush/web-sdk build && npm run prepare-deploy`
   - Build output directory: `packages/web-sdk/deploy`
   - Root directory: `/`

#### Option C: Direct Upload (Dashboard)

1. Go to Cloudflare Pages dashboard
2. Create new project
3. Upload the `deploy/` folder
4. Set custom domain: `sdk.adscrush.com`

### Step 5: Configure Custom Domain

1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add custom domain: `sdk.adscrush.com`
3. Cloudflare will automatically configure DNS

## File Structure

After deployment, your SDK will be available at:

```
https://sdk.adscrush.com/v1/index.iife.min.js  (Main SDK)
https://sdk.adscrush.com/v1/index.mjs          (ES Module)
https://sdk.adscrush.com/v1/index.js           (CommonJS)
https://sdk.adscrush.com/v1/index.d.ts         (TypeScript definitions)
https://sdk.adscrush.com/sdk.js                (Root access)
```

## Automated Deployment Script

Create `packages/web-sdk/scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🔨 Building SDK..."
pnpm build

echo "📦 Preparing deployment..."
rm -rf deploy
mkdir -p deploy/v1

# Copy built files
cp dist/index.iife.min.js deploy/v1/
cp dist/index.iife.min.js.map deploy/v1/
cp dist/index.mjs deploy/v1/
cp dist/index.js deploy/v1/
cp dist/*.d.ts deploy/v1/

# Copy to root
cp dist/index.iife.min.js deploy/sdk.js

# Create _headers
cat > deploy/_headers << 'EOF'
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

/v1/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable
EOF

echo "🚀 Deploying to Cloudflare Pages..."
cd deploy
wrangler pages deploy . --project-name=adscrush-sdk --branch=main

echo "✅ Deployment complete!"
echo "📍 SDK available at: https://sdk.adscrush.com/v1/index.iife.min.js"
```

Make it executable:

```bash
chmod +x packages/web-sdk/scripts/deploy.sh
```

Run deployment:

```bash
cd packages/web-sdk
./scripts/deploy.sh
```

## GitHub Actions (Automated)

Create `.github/workflows/deploy-sdk.yml`:

```yaml
name: Deploy SDK to Cloudflare Pages

on:
  push:
    branches:
      - main
    paths:
      - 'packages/web-sdk/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build SDK
        run: pnpm --filter @adscrush/web-sdk build
      
      - name: Prepare deployment
        run: |
          mkdir -p packages/web-sdk/deploy/v1
          cp packages/web-sdk/dist/index.iife.min.js packages/web-sdk/deploy/v1/
          cp packages/web-sdk/dist/index.iife.min.js.map packages/web-sdk/deploy/v1/
          cp packages/web-sdk/dist/index.mjs packages/web-sdk/deploy/v1/
          cp packages/web-sdk/dist/index.js packages/web-sdk/deploy/v1/
          cp packages/web-sdk/dist/*.d.ts packages/web-sdk/deploy/v1/
          cp packages/web-sdk/dist/index.iife.min.js packages/web-sdk/deploy/sdk.js
      
      - name: Create _headers
        run: |
          cat > packages/web-sdk/deploy/_headers << 'EOF'
          /*
            Access-Control-Allow-Origin: *
            Access-Control-Allow-Methods: GET, OPTIONS
            Access-Control-Allow-Headers: Content-Type
            Cache-Control: public, max-age=31536000, immutable
            X-Content-Type-Options: nosniff
          
          /v1/*
            Access-Control-Allow-Origin: *
            Cache-Control: public, max-age=31536000, immutable
          EOF
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy packages/web-sdk/deploy --project-name=adscrush-sdk --branch=main
```

## Verify Deployment

After deployment, test your SDK:

```bash
# Test main SDK file
curl -I https://sdk.adscrush.com/v1/index.iife.min.js

# Should return:
# HTTP/2 200
# content-type: application/javascript
# access-control-allow-origin: *
# cache-control: public, max-age=31536000, immutable
```

Test in browser:

```html
<script src="https://sdk.adscrush.com/v1/index.iife.min.js"></script>
<script>
  console.log(typeof AdsCrushSDK) // Should log "object"
  console.log(AdsCrushSDK.getClickId()) // Should work
</script>
```

## Version Management

To deploy a new version:

1. Update version in `package.json`
2. Build: `pnpm build`
3. Deploy to versioned path: `/v2/`, `/v3/`, etc.
4. Keep `/v1/` for backward compatibility

Example structure:
```
/v1/index.iife.min.js  (Version 1.x)
/v2/index.iife.min.js  (Version 2.x)
/latest/index.iife.min.js  (Always points to latest)
```

## Troubleshooting

### CORS Errors

If you see CORS errors, verify `_headers` file is deployed correctly:

```bash
curl -I https://sdk.adscrush.com/v1/index.iife.min.js | grep -i "access-control"
```

### Cache Issues

If changes aren't reflecting:

1. Purge Cloudflare cache
2. Add version query param: `?v=1.0.1`
3. Use Cloudflare's "Purge Everything" option

### File Not Found

Verify deployment structure:

```bash
wrangler pages deployment list --project-name=adscrush-sdk
```

## Production Checklist

- [ ] Build SDK: `pnpm build`
- [ ] Test locally: Open `dist/index.iife.min.js` in browser
- [ ] Deploy to Cloudflare Pages
- [ ] Configure custom domain: `sdk.adscrush.com`
- [ ] Verify CORS headers are set
- [ ] Test SDK loading: `curl https://sdk.adscrush.com/v1/index.iife.min.js`
- [ ] Update documentation with new CDN URL
- [ ] Test integration on sample landing page
- [ ] Set up automated deployments (GitHub Actions)

---

**Your SDK is now live at: `https://sdk.adscrush.com/v1/index.iife.min.js`** 🚀
