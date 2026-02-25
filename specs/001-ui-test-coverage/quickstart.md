# Quickstart: Running the UI Test Suite

**Branch**: `001-ui-test-coverage` | **Date**: 2026-02-25

---

## Prerequisites

Standard project installation — no additional setup required:

```bash
yarn install            # from monorepo root
```

For E2E tests, install Playwright browsers once after `yarn install`:

```bash
cd apps/web
yarn playwright install chromium
```

---

## Running Component Tests (Vitest + RTL)

```bash
cd apps/web

# Run all component tests once (CI mode)
yarn test

# Run in watch mode (development)
yarn test:watch
```

These tests run in under 5 seconds. No server required.

---

## Running E2E Tests (Playwright)

```bash
cd apps/web

# Run all E2E tests (starts dev server automatically)
yarn test:e2e

# Run a specific spec file
yarn test:e2e --grep "auth"
```

Playwright auto-starts `next dev` on port 3000 and stops it when done. No manual server management needed.

---

## Running Everything

```bash
cd apps/web

# Component tests first (fast), then E2E
yarn test && yarn test:e2e
```

Total expected time: under 3 minutes.

---

## Test File Map

| Test File | Framework | User Story | What It Covers |
|-----------|-----------|-----------|----------------|
| `e2e/auth.spec.ts` | Playwright | US1 | Sign-in, sign-out, unauthenticated redirect |
| `e2e/block-lifecycle.spec.ts` | Playwright | US2 | Create block, archive, restore |
| `e2e/profile.spec.ts` | Playwright | US5 | Profile pre-fill, save confirmation, cancel revert |
| `__tests__/blocks-client.test.tsx` | Vitest + RTL | US3 | Search, type filter, tab switcher, clear filters |
| `__tests__/create-block-dialog.test.tsx` | Vitest + RTL | US4 | Required field validation (title, content) |

---

## Troubleshooting

**`Error: browserType.launch: Executable doesn't exist`**
→ Run `yarn playwright install chromium`

**Port 3000 already in use**
→ Stop any running `next dev` process, then re-run `yarn test:e2e`

**Vitest can't resolve `@/` imports**
→ Ensure `vitest.config.ts` has the `resolve.alias` pointing `@` to `apps/web/`
