# @adscrush/email

React Email templates for AdScrush application.

## Installation

```bash
pnpm install
```

## Development

To preview email templates in a development environment:

```bash
pnpm email:dev
```

This will start the React Email dev server at `http://localhost:3001`.

## Building

To build email templates for production:

```bash
pnpm email:build
```

To export templates as static HTML:

```bash
pnpm email:export
```

## Available Templates

- **MagicLinkEmail** - Magic link authentication emails (with Tailwind)
- **MagicLinkEmail** - Magic link authentication emails (inline styles)
- **PasswordResetEmail** - Password reset emails

## Usage

```typescript
import { render } from '@react-email/render';
import { MagicLinkEmail } from '@adscrush/email';

const html = await render(<MagicLinkEmail url="https://example.com/login?token=xxx" />);
```
