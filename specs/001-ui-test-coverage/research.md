# Research: UI Behavioral Test Coverage

**Branch**: `001-ui-test-coverage` | **Date**: 2026-02-25
**Phase**: 0 — Outline & Research

---

## Decision 1: E2E Test Framework

**Decision**: Playwright (`@playwright/test`)

**Rationale**:
- Next.js 16 official documentation recommends Playwright for E2E testing.
- First-class support for cookie manipulation — sessions can be pre-seeded per test via `page.context().addCookies()`, matching Blockora's cookie-based mock auth pattern.
- `webServer` config block auto-starts `next dev` before the suite and tears it down after, keeping setup zero-effort.
- Parallel execution by default (workers), enabling the SC-004 < 3-minute requirement at scale.
- Native TypeScript, no extra transform config needed.

**Alternatives Considered**:
- **Cypress**: More verbose API, slower (single-threaded by default), requires a separate plugin for cookie setup. No meaningful advantage here.
- **Selenium/WebDriver**: Too low-level; significant boilerplate for modern React apps.

---

## Decision 2: Component/Integration Test Framework

**Decision**: Vitest 3 + `@testing-library/react` (RTL)

**Rationale**:
- Vitest uses native ESM, which aligns with Next.js App Router and avoids the CommonJS transform friction of Jest + `next/jest`.
- Vitest's `jsdom` environment renders Client Components (`"use client"`) in a simulated browser context — the exact target for RTL integration tests.
- `@testing-library/user-event` v14 provides realistic async interaction simulation (typing, clicking) with no extra config.
- The `@testing-library/jest-dom` matcher library extends Vitest's expect automatically via a setup file.
- Vitest is dramatically faster than Jest on cold starts (no Jest runner overhead).

**Alternatives Considered**:
- **Jest + `next/jest`**: Official but requires `transformIgnorePatterns` tuning for ESM packages (`sonner`, `lucide-react`). RTL tests for Client Components work fine with Vitest without that friction.
- **Playwright Component Testing**: Playwright has a component testing mode (experimental) but it's overkill here and slower than Vitest for pure unit/integration assertions.

---

## Decision 3: Test Targets — What to Cover With Each Framework

| User Story | Framework | File | Rationale |
|------------|-----------|------|-----------|
| US1 — Authentication Flow | Playwright | `e2e/auth.spec.ts` | Multi-page journey; requires real navigation and cookie state |
| US2 — Block Lifecycle | Playwright | `e2e/block-lifecycle.spec.ts` | Multi-step flow spanning create, archive, restore across views |
| US3 — Dashboard Filtering | Vitest + RTL | `__tests__/blocks-client.test.tsx` | Single component, controlled dataset, no navigation needed |
| US4 — Create Block Form Validation | Vitest + RTL | `__tests__/create-block-dialog.test.tsx` | Dialog in isolation; purely about validation state and messages |
| US5 — Profile Page | Playwright | `e2e/profile.spec.ts` | Requires authenticated navigation to `/profile` route |

---

## Decision 4: Mock / Fixture Strategy

**E2E (Playwright)**:
- No fixture files needed. The app already uses `lib/mock-data.ts` for in-memory data; the dev server serves real pages with that data.
- Authentication: a shared `authFixture` helper pre-seeds the `blockora-session=1` cookie via `page.context().addCookies()` before each test that requires it. Unauthenticated tests explicitly skip this step.
- No running backend or database required (spec assumption confirmed by `lib/mock-data.ts`).

**Vitest + RTL**:
- Inline test data: a small array of `Block` objects typed against `lib/types.ts`.
- Mocks needed:
  - `next/navigation` → `vi.mock('next/navigation', ...)` returning a mock `useRouter` with `push` and `refresh` spies.
  - `sonner` → `vi.mock('sonner', ...)` returning a `toast` object with jest-fn stubs (prevents real toast rendering, allows assertion).
  - No mock needed for `@radix-ui/react-dialog` — renders fine in jsdom.

---

## Decision 5: Configuration Files

| File | Purpose |
|------|---------|
| `apps/web/vitest.config.ts` | Vitest config: jsdom environment, React plugin, setup file, path aliases (`@/`) |
| `apps/web/vitest.setup.ts` | Imports `@testing-library/jest-dom` to extend Vitest's expect |
| `apps/web/playwright.config.ts` | Playwright config: baseURL, webServer (next dev), test directory, single browser (chromium) for speed |

---

## Decision 6: New Dependencies

**`apps/web/package.json` — devDependencies**:

```
@playwright/test          ^1.50
vitest                    ^3
@vitejs/plugin-react      ^4
@testing-library/react    ^16
@testing-library/user-event ^14
@testing-library/jest-dom ^6
jsdom                     ^26
```

No new production dependencies. All test tooling is dev-only.

---

## Decision 7: Test Scripts

**`apps/web/package.json` — scripts**:

```json
"test":        "vitest run",
"test:watch":  "vitest",
"test:e2e":    "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Resolved Constraints

| Constraint (from spec) | How Resolved |
|------------------------|-------------|
| SC-004: Full suite < 3 min | Playwright runs tests in parallel workers; Vitest runs all 5 test files in < 5 seconds |
| SC-005: Zero flaky tests | No network calls; no timers; Playwright uses auto-wait assertions (`toBeVisible`, `toHaveURL`) which are stable by design |
| SC-006: Zero config beyond install | `webServer` block handles dev server; `vitest.setup.ts` handled by `setupFiles` config |
| FR-010: Tests independent, no shared state | Each Playwright test creates a fresh browser context; each Vitest test uses a fresh component render |
