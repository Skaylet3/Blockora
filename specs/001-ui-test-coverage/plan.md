# Implementation Plan: UI Behavioral Test Coverage

**Branch**: `001-ui-test-coverage` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ui-test-coverage/spec.md`

## Summary

Add automated behavioral test coverage for Blockora's primary UI flows: three Playwright E2E tests cover authentication, block lifecycle, and profile page; two Vitest + RTL integration tests cover dashboard filtering and create-block form validation. Together these 5 suites pin all 11 acceptance scenarios in the spec with zero external dependencies (no backend, no database).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: Playwright 1.50 (E2E), Vitest 3 + @testing-library/react 16 (component tests)
**Storage**: N/A — tests use mock in-memory data (`lib/mock-data.ts` + inline fixtures)
**Testing**: `vitest` (component), `@playwright/test` (E2E)
**Target Platform**: Node.js ≥18, Chromium (Playwright), jsdom 26 (Vitest)
**Project Type**: Web application — Next.js 16, App Router, React 19
**Performance Goals**: Full suite completes in < 3 minutes (SC-004); component tests < 5 seconds
**Constraints**: Zero flaky tests (SC-005); zero config beyond `yarn install` + `playwright install chromium` (SC-006)
**Scale/Scope**: 5 test files, ~25 test cases total covering all acceptance scenarios in spec

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Blocks Are Atomic | ✅ Pass | Tests verify Block behavior; no schema changes introduced |
| II. Privacy by Default | ✅ Pass | Tests run against mock data only; no real user data touched |
| III. Simplicity Over Features | ✅ Pass | Two frameworks chosen by strict need (E2E vs component); no extra tooling |
| IV. Performance is a Feature | ✅ Pass | Playwright parallel workers + Vitest fast runner meet SC-004 |
| V. Type-Safe and Test-Driven | ✅ Pass | This feature IS the test implementation; all fixtures typed against `lib/types.ts` |
| VI. Monorepo Discipline | ✅ Pass | All test code lives in `apps/web/`; no cross-app imports |

**Verdict**: All gates pass. No complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-test-coverage/
├── plan.md              # This file
├── research.md          # Phase 0 — framework decisions and rationale
├── data-model.md        # Phase 1 — test fixtures and mock data design
├── quickstart.md        # Phase 1 — how to run tests
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/
├── e2e/                              # Playwright E2E tests
│   ├── helpers.ts                    # seedSession() auth fixture helper
│   ├── auth.spec.ts                  # US1 — Authentication flow (3 scenarios)
│   ├── block-lifecycle.spec.ts       # US2 — Block create/archive/restore (3 scenarios)
│   └── profile.spec.ts               # US5 — Profile pre-fill, save, cancel (3 scenarios)
│
├── __tests__/                        # Vitest + RTL integration tests
│   ├── fixtures.ts                   # createBlock() typed factory
│   ├── blocks-client.test.tsx        # US3 — Dashboard search, filters, tabs (4 scenarios)
│   └── create-block-dialog.test.tsx  # US4 — Form validation (3 scenarios)
│
├── vitest.config.ts                  # Vitest: jsdom, React plugin, @/ alias, setup file
├── vitest.setup.ts                   # Imports @testing-library/jest-dom
├── playwright.config.ts              # Playwright: baseURL, webServer, chromium only
└── package.json                      # Updated: new devDeps + test/test:e2e scripts
```

**Structure Decision**: Single project (apps/web) — all test code co-located with the source it tests. E2E tests go in `e2e/` (Playwright convention). Component tests go in `__tests__/` at the app root. No new package created; no shared package needed.

## Complexity Tracking

> No violations found in Constitution Check — this section is intentionally empty.
