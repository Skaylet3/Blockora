# Data Model: UI Behavioral Test Coverage

**Branch**: `001-ui-test-coverage` | **Date**: 2026-02-25
**Phase**: 1 — Design

---

## Overview

This feature adds no production data models. The test suite operates against the existing `Block` entity and mock data already defined in `apps/web/lib/`. This document describes the **test data structures** — fixtures and helpers used across the test files.

---

## Existing Production Entity: Block

Defined in `apps/web/lib/types.ts`:

```ts
type BlockType   = "Note" | "Task" | "Snippet" | "Idea"
type BlockStatus = "active" | "archived"

interface Block {
  id:        string
  title:     string
  content:   string
  type:      BlockType
  tags:      string[]
  status:    BlockStatus
  createdAt: string   // ISO 8601
  updatedAt: string   // ISO 8601
}
```

No changes to this entity are required.

---

## Test Fixture: `createBlock`

**Used in**: Vitest RTL tests (`__tests__/`)
**Purpose**: Create a typed `Block` with safe defaults; override any field per-test.

```ts
// apps/web/__tests__/fixtures.ts

import type { Block } from "@/lib/types"

let seq = 0

export function createBlock(overrides: Partial<Block> = {}): Block {
  seq++
  return {
    id:        `test-${seq}`,
    title:     `Test Block ${seq}`,
    content:   `Content for block ${seq}`,
    type:      "Note",
    tags:      [],
    status:    "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}
```

---

## Test Dataset: `DASHBOARD_BLOCKS`

**Used in**: `__tests__/blocks-client.test.tsx` (US3 — filtering and search)
**Purpose**: Predictable, minimal dataset that satisfies all filter/search acceptance scenarios.

```ts
// Defined inline in blocks-client.test.tsx

const DASHBOARD_BLOCKS: Block[] = [
  createBlock({ id: "b1", title: "React Hooks Guide",    content: "useState and useEffect patterns", type: "Note",    tags: ["react"],       status: "active"   }),
  createBlock({ id: "b2", title: "Deploy Checklist",     content: "Steps before going to production",  type: "Task",    tags: ["devops"],      status: "active"   }),
  createBlock({ id: "b3", title: "Auth Snippet",         content: "JWT decode helper function",        type: "Snippet", tags: ["auth", "jwt"], status: "active"   }),
  createBlock({ id: "b4", title: "Old Note",             content: "This note was archived",             type: "Note",    tags: [],              status: "archived" }),
  createBlock({ id: "b5", title: "Completed Task",       content: "Already done",                       type: "Task",    tags: ["devops"],      status: "archived" }),
]
```

**Coverage provided by this dataset**:

| Scenario | Blocks involved |
|----------|----------------|
| Search by title | `b1` matches "React", `b2` matches "Deploy" |
| Search by content | `b3` matches "JWT" in content |
| Filter by Type=Note | Returns `b1` only (active) |
| Filter by Type=Task | Returns `b2` only (active) |
| Active tab | `b1`, `b2`, `b3` |
| Archived tab | `b4`, `b5` |
| Clear filters | All blocks for current tab restored |
| Empty state (no match) | Search "zzznomatch" on active tab |

---

## Test Session: Playwright Auth Cookie

**Used in**: `e2e/auth.spec.ts`, `e2e/block-lifecycle.spec.ts`, `e2e/profile.spec.ts`
**Purpose**: Pre-seed authentication to bypass the login page for tests that require an authenticated state.

```ts
// apps/web/e2e/helpers.ts

import type { BrowserContext } from "@playwright/test"

export async function seedSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([{
    name:   "blockora-session",
    value:  "1",
    url:    baseURL,
    path:   "/",
  }])
}
```

**State transitions tested in auth.spec.ts**:

```
Unauthenticated → /login page (redirect from /)
         ↓  submit valid credentials
Authenticated → / dashboard
         ↓  click sign-out
Unauthenticated → /login page
```

---

## State Transition: Block Status

**Used in**: `e2e/block-lifecycle.spec.ts`

```
created (active) → [archive action] → archived → [restore action] → active
```

Both transitions are asserted by verifying the block's presence/absence in the active vs. archived grid after each action.

---

## Mocks Registry (Vitest RTL)

| Dependency | Mock Strategy | Reason |
|-----------|---------------|--------|
| `next/navigation` (useRouter) | `vi.mock(...)` with `push` and `refresh` as `vi.fn()` | RTL renders components outside the Next.js router tree |
| `sonner` (toast) | `vi.mock(...)` with all methods as `vi.fn()` | Prevents real toast rendering; allows `expect(toast.success).toHaveBeenCalledWith(...)` |
| `@radix-ui/react-dialog` | Not mocked | Renders correctly in jsdom; testing the real implementation is preferred |
| `lib/mock-data.ts` | Not mocked | RTL tests pass their own `initialBlocks` prop; mock-data is only used in SSR |
