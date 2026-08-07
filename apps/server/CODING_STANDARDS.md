# Coding Standards

This document defines the coding standards and conventions for the `@adscrush/server` package.

---

## 📁 File Naming Conventions

### Rule: Always Use Kebab-Case

All TypeScript files **MUST** use `kebab-case` naming:

| ✅ Correct | ❌ Incorrect |
|-----------|-------------|
| `users.service.ts` | `UsersService.ts` |
| `campaigns.repository.ts` | `CampaignsRepository.ts` |
| `portal-helpers.ts` | `PortalHelpers.ts` |
| `media-buyer.schema.ts` | `MediaBuyerSchema.ts` |
| `report-utils.ts` | `ReportUtils.ts` |

### Exceptions

- **Test files**: Use `*.spec.ts` or `*.test.ts` suffix
  - ✅ `users.service.spec.ts`
  - ✅ `campaigns.test.ts`

- **Type declaration files**: Use `*.d.ts` suffix
  - ✅ `global.d.ts`

---

## 📦 Module Structure

Each feature module follows this structure:

```
modules/
└── feature-name/
    ├── index.ts              # Public API exports
    ├── feature-name.types.ts # Types, schemas, interfaces
    ├── feature-name.repository.ts  # Data access layer
    ├── feature-name.service.ts     # Business logic
    └── feature-name.router.ts      # API routes (thin layer)
```

### File Naming Pattern

```
{module-name}.{layer}.ts
```

Examples:
- `users.repository.ts`
- `campaigns.service.ts`
- `leads.types.ts`

---

## 🏷️ Identifier Naming Conventions

### Variables & Parameters
- Use `lowerCamelCase`
- Examples: `userId`, `isActive`, `totalCount`

### Functions & Methods
- Use `lowerCamelCase` with verb-first naming
- Examples: `getUserById()`, `calculateRevenue()`, `validateInput()`

### Classes, Interfaces, Types
- Use `UpperCamelCase` (PascalCase)
- Examples: `UserService`, `Campaign`, `ApiResponse<T>`

### Enums
- Use `UpperCamelCase` for enum name and members
- Examples:
  ```typescript
  enum CampaignStatus {
    Active = "active",
    Paused = "paused",
  }
  ```

### Constants
- Use `UPPER_SNAKE_CASE` for global constants
- Examples: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT_MS`

### Boolean Flags
- Prefix with `is`, `has`, `should`, `can`
- Examples: `isLoading`, `hasPermission`, `canDelete`

---

## 📐 Code Organization Principles

### 1. Co-location Over Separation
Keep related code together in the same module:

```typescript
// ✅ Good: Types co-located with module
// modules/campaigns/campaigns.types.ts
export interface Campaign {
  id: string
  name: string
}

// modules/campaigns/campaigns.service.ts
import { Campaign } from "./campaigns.types"
```

### 2. Thin Controllers, Fat Services
Routers handle only auth and validation:

```typescript
// ✅ Good: Thin router
export const campaignsRouter = router({
  list: permissionProcedure("campaigns.view")
    .input(listCampaignsInputSchema)
    .query(async ({ ctx, input }) => 
      service.listCampaigns(ctx.db, input, ctx.scope)
    ),
})

// ✅ Good: Fat service with business logic
export async function listCampaigns(db, input, scope) {
  // Business rules, validation, transformations
}
```

### 3. Repository Pattern
All database queries go through the repository:

```typescript
// ✅ Good: Repository handles all DB queries
export async function findCampaigns(db, filters) {
  return db.select().from(campaigns).where(filters)
}

// ✅ Good: Service uses repository
export async function listCampaigns(db, input, scope) {
  return repository.findCampaigns(db, buildFilters(input, scope))
}
```

---

## 🎯 Type Safety Rules

### 1. Avoid `any`
Use proper types instead of `any`:

```typescript
// ❌ Bad
function processData(data: any) { }

// ✅ Good
function processData(data: CampaignInput) { }
```

### 2. Use `unknown` for External Input
When handling untrusted data:

```typescript
// ✅ Good
function parseInput(data: unknown): CampaignInput {
  return campaignInputSchema.parse(data)
}
```

### 3. Prefer `interface` for Object Shapes
Use `interface` for extensible objects:

```typescript
// ✅ Good: Interface for extensible objects
interface Campaign {
  id: string
  name: string
}

// ✅ Good: Type for unions/intersections
type CampaignStatus = "active" | "paused" | "deleted"
```

---

## 🧪 Testing Conventions

### File Location
Place test files next to the source file:

```
modules/users/
├── users.service.ts
└── users.service.spec.ts
```

### Test Naming
- Use `*.spec.ts` for unit tests
- Use `*.test.ts` for integration tests

### Test Structure
```typescript
describe("UserService", () => {
  describe("getUserById", () => {
    it("should return user when found", async () => { })
    it("should throw when user not found", async () => { })
  })
})
```

---

## 📝 Import Conventions

### 1. Use Path Aliases
```typescript
// ✅ Good: Use ~ alias for src
import { throwNotFound } from "~/lib/helpers/errors"
import { db } from "~/lib/db"

// ❌ Bad: Relative paths
import { throwNotFound } from "../../../lib/helpers/errors"
```

### 2. Group Imports
```typescript
// ✅ Good: Grouped imports
import { and, eq, sql } from "@adscrush/db/drizzle"
import { campaigns, products } from "@adscrush/db/schema"

import { throwNotFound } from "~/lib/helpers/errors"
import type { Database } from "@adscrush/db"

import * as repository from "./campaigns.repository"
```

---

## 🔧 ESLint Rules

The following ESLint rules enforce these conventions:

```javascript
// eslint.config.js
{
  rules: {
    "@typescript-eslint/naming-convention": [
      "error",
      // Variables and parameters: camelCase
      { selector: "variable", format: ["camelCase", "UPPER_CASE"] },
      { selector: "parameter", format: ["camelCase"] },
      // Functions: camelCase
      { selector: "function", format: ["camelCase"] },
      // Classes and interfaces: PascalCase
      { selector: "class", format: ["PascalCase"] },
      { selector: "interface", format: ["PascalCase"] },
      // Enums: PascalCase
      { selector: "enum", format: ["PascalCase"] },
      { selector: "enumMember", format: ["PascalCase"] },
    ],
  },
}
```

---

## 📚 References

- [TypeScript Style Guide](https://typescript-eslint.io/linting/configs)
- [Google TypeScript Style Guide](https://google.github.io/style/tsguide.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
