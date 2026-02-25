---

description: "Task list for UI Behavioral Test Coverage"
---

# Tasks: UI Behavioral Test Coverage

**Input**: Design documents from `/specs/001-ui-test-coverage/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to (US1–US5)
- **No story label**: Setup, foundational, or polish task

---

## Phase 1: Setup (Install + Configure)

**Purpose**: Add test tooling to `apps/web` — new devDependencies, config files, and npm scripts. No source code is modified.

- [x] T001 Add devDependencies (`@playwright/test ^1.50`, `vitest ^3`, `@vitejs/plugin-react ^4`, `@testing-library/react ^16`, `@testing-library/user-event ^14`, `@testing-library/jest-dom ^6`, `jsdom ^26`) and scripts (`"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`) to `apps/web/package.json`
- [x] T002 [P] Create `apps/web/vitest.config.ts` — environment: `jsdom`, plugins: `[@vitejs/plugin-react()]`, setupFiles: `['./vitest.setup.ts']`, resolve alias: `{ '@': path.resolve(__dirname, '.') }`, test include: `['**/__tests__/**/*.test.tsx']`
- [x] T003 [P] Create `apps/web/vitest.setup.ts` — single line: `import '@testing-library/jest-dom'`
- [x] T004 [P] Create `apps/web/playwright.config.ts` — baseURL: `http://localhost:3000`, testDir: `./e2e`, projects: `[{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`, webServer: `{ command: 'yarn dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI }`
- [x] T005 Run `yarn install` from monorepo root (picks up new devDependencies in `apps/web/package.json`), then run `yarn playwright install chromium` from `apps/web/` to download the browser binary

**Checkpoint**: `yarn test` and `yarn test:e2e` commands exist; Playwright binary is installed; no tests exist yet so both commands exit cleanly or print "no tests found"

---

## Phase 2: Foundational (Shared Test Helpers)

**Purpose**: Create the shared fixture factory and auth helper that ALL test files depend on. Both files are independent and can be written in parallel.

**⚠️ CRITICAL**: Both helpers must exist before any test file in Phase 3–7 is written.

- [x] T006 [P] Create `apps/web/__tests__/fixtures.ts` — export `createBlock(overrides?: Partial<Block>): Block` factory using a module-level sequence counter; all fields typed against `Block` from `@/lib/types`; safe defaults: `id: \`test-\${seq}\``, `title: \`Test Block \${seq}\``, `content: \`Content for block \${seq}\``, `type: "Note"`, `tags: []`, `status: "active"`, `createdAt/updatedAt: "2026-01-01T00:00:00.000Z"`
- [x] T007 [P] Create `apps/web/e2e/helpers.ts` — export `async function seedSession(context: BrowserContext, baseURL: string): Promise<void>` that calls `context.addCookies([{ name: 'blockora-session', value: '1', url: baseURL, path: '/' }])`; import `BrowserContext` from `@playwright/test`

**Checkpoint**: Both helper files compile with `tsc --noEmit`; `createBlock()` returns a valid `Block`; `seedSession()` type-checks correctly

---

## Phase 3: User Story 1 — Authentication Flow (Priority: P1) 🎯 MVP

**Goal**: Playwright test that verifies the complete sign-in/sign-out journey and the unauthenticated redirect.

**Independent Test**: `cd apps/web && yarn test:e2e --grep "auth"` — all 3 scenarios pass with a green terminal.

- [x] T008 [US1] Create `apps/web/e2e/auth.spec.ts` — 3 `test()` blocks using `@playwright/test`:
  1. **Unauthenticated redirect**: `test.use({ storageState: { cookies: [], origins: [] } })` (no cookie); navigate to `'/'`; `await expect(page).toHaveURL('/login')`
  2. **Sign-in flow**: navigate to `'/login'`; `page.getByLabel('Email')` → fill `'demo@example.com'`; `page.getByLabel('Password')` → fill `'password'`; click `page.getByRole('button', { name: 'Sign in' })`; `await expect(page).toHaveURL('/')`; assert blocks grid visible via `expect(page.getByRole('grid') or page.locator('[data-testid="blocks-grid"]') or heading`).toBeVisible()`
  3. **Sign-out**: call `seedSession(page.context(), baseURL)` then navigate to `'/'`; click `page.getByRole('button', { name: 'Sign out' })` (aria-label="Sign out"); `await expect(page).toHaveURL('/login')`; navigate to `'/'` again; `await expect(page).toHaveURL('/login')`

**Checkpoint**: `yarn test:e2e --grep "auth"` passes all 3 tests; US1 acceptance scenarios 1–3 are covered

---

## Phase 4: User Story 2 — Block Lifecycle (Priority: P2)

**Goal**: Playwright test covering block creation, archiving, and restoration end-to-end.

**Independent Test**: `cd apps/web && yarn test:e2e --grep "block lifecycle"` — all 3 scenarios pass.

- [x] T009 [US2] Create `apps/web/e2e/block-lifecycle.spec.ts` — use `test.beforeEach` to call `seedSession(page.context(), baseURL)` and navigate to `'/'`; 3 `test()` blocks:
  1. **Create block**: click button with text "New Block" to open dialog; fill `page.getByLabel('Title')` → `'E2E Test Block'`; fill content textarea → `'Playwright created this'`; click submit button; `await expect(page.getByText('E2E Test Block')).toBeVisible()`; assert it appears at top of the grid (first card)
  2. **Archive block**: after creating "E2E Test Block", click its card to open the detail sheet; click the archive button (look for button with text "Archive"); assert "E2E Test Block" is no longer visible on the active tab; click the "Archived" tab; `await expect(page.getByText('E2E Test Block')).toBeVisible()`
  3. **Restore block**: navigate to Archived tab; find "E2E Test Block"; click its card; click the restore button (text "Restore" or status toggle); click "Active" tab; `await expect(page.getByText('E2E Test Block')).toBeVisible()`

**Checkpoint**: `yarn test:e2e --grep "block lifecycle"` passes all 3 tests; US2 acceptance scenarios 1–3 are covered

---

## Phase 5: User Story 3 — Dashboard Filtering & Search (Priority: P3)

**Goal**: Vitest + RTL test that renders `BlocksClient` with `DASHBOARD_BLOCKS` and verifies all four filter scenarios.

**Independent Test**: `cd apps/web && yarn test blocks-client` — all 4 scenarios pass.

- [x] T010 [US3] Create `apps/web/__tests__/blocks-client.test.tsx` — add these at the top before imports: `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))` and `vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))`; define `DASHBOARD_BLOCKS` array of 5 `Block`s via `createBlock()` (3 active: Note "React Hooks Guide", Task "Deploy Checklist", Snippet "Auth Snippet"; 2 archived: Note "Old Note", Task "Completed Task"); 4 `it()` blocks using `render(<BlocksClient initialBlocks={DASHBOARD_BLOCKS} />)` and `@testing-library/user-event`:
  1. **Search by query**: `userEvent.type(screen.getByPlaceholderText(/search/i), 'React')`; assert "React Hooks Guide" visible; assert "Deploy Checklist" and "Auth Snippet" not in document or have `display:none`
  2. **Type filter**: `userEvent.selectOptions(screen.getByRole('combobox', { name: /type/i }), 'Note')`; assert only "React Hooks Guide" visible among active blocks
  3. **Tab switcher**: click `screen.getByRole('tab', { name: /archived/i })`; assert "Old Note" and "Completed Task" visible; assert "React Hooks Guide" not visible
  4. **Clear filters**: type a query that matches nothing, e.g. `'zzznomatch'`; assert empty state element visible; click clear filters button; assert all 3 active blocks are visible again

**Checkpoint**: `yarn test blocks-client` passes all 4 tests; US3 acceptance scenarios 1–4 are covered

---

## Phase 6: User Story 4 — Create Block Form Validation (Priority: P4)

**Goal**: Vitest + RTL test that renders `CreateBlockDialog` and verifies required-field validation.

**Independent Test**: `cd apps/web && yarn test create-block-dialog` — all 3 scenarios pass.

- [x] T011 [US4] Create `apps/web/__tests__/create-block-dialog.test.tsx` — mock `next/navigation` and `sonner` same as T010; import `CreateBlockDialog` from `@/components/create-block-dialog`; write a `renderDialog()` helper that renders `<CreateBlockDialog open onSubmit={vi.fn()} onOpenChange={vi.fn()} />`; 3 `it()` blocks:
  1. **Missing title**: leave title empty, fill content → `'Some content'`; click submit button (`getByRole('button', { name: /create/i })`); assert a validation message for title field is visible (`getByText(/title.*required/i)` or similar); assert dialog is still open (the submit `onSubmit` mock was NOT called)
  2. **Missing content**: fill title → `'Some Title'`, leave content empty; click submit; assert validation message for content visible; assert `onSubmit` NOT called
  3. **Valid submit**: fill title → `'Valid Title'` and content → `'Valid content'`; click submit; assert `onSubmit` was called once with data including `title: 'Valid Title'`

**Checkpoint**: `yarn test create-block-dialog` passes all 3 tests; US4 acceptance scenarios 1–3 are covered

---

## Phase 7: User Story 5 — Profile Page (Priority: P5)

**Goal**: Playwright test covering profile page pre-fill, save confirmation, and cancel revert.

**Independent Test**: `cd apps/web && yarn test:e2e --grep "profile"` — all 3 scenarios pass.

- [x] T012 [US5] Create `apps/web/e2e/profile.spec.ts` — use `test.beforeEach` to `seedSession` and navigate to `'/profile'`; 3 `test()` blocks:
  1. **Pre-fill**: `await expect(page.getByLabel('Name')).not.toBeEmpty()`; `await expect(page.getByLabel('Email')).not.toBeEmpty()` — verifies form loads with existing user data
  2. **Save confirmation**: `page.getByLabel('Name')` → triple-click to select all → type `'New Name'`; click `page.getByRole('button', { name: 'Save Changes' })`; `await expect(page.getByText(/profile updated/i)).toBeVisible()` (Sonner toast or inline message)
  3. **Cancel revert**: read original name via `await page.getByLabel('Name').inputValue()`; triple-click name field → type `'Temporary Name'`; click `page.getByRole('button', { name: 'Cancel' })`; `await expect(page.getByLabel('Name')).toHaveValue(originalName)`

**Checkpoint**: `yarn test:e2e --grep "profile"` passes all 3 tests; US5 acceptance scenarios 1–3 are covered

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge case coverage, pipeline integration, and final quality validation.

- [x] T013 [P] Add edge case tests to `apps/web/__tests__/blocks-client.test.tsx` — 3 additional `it()` blocks: (a) **rapid duplicate create** — call `handleCreateBlock` twice with same data synchronously, assert only one new block appears (prevents duplicate `id`); (b) **zero-match search shows empty state** — type `'zzznomatch'`, assert empty-state element visible and no block cards present; (c) **all active blocks archived shows empty state** — render with all blocks having `status: "archived"`, assert active tab shows empty state
- [x] T014 [P] Add `"test"` and `"test:e2e"` task entries to root `turbo.json` so `turbo run test` and `turbo run test:e2e` work from the monorepo root — set `"dependsOn": []` and `"cache": true` for `test`; `"cache": false` for `test:e2e` (browser state is not safely cacheable)
- [x] T015 Run the complete test suite three consecutive times (`yarn test && yarn test:e2e`) and verify: (a) total wall-clock time is under 3 minutes (SC-004), (b) all runs produce identical results with zero flaky tests (SC-005), (c) a new terminal after `yarn install` + `yarn playwright install chromium` is sufficient to run both suites with no other setup (SC-006)

**Checkpoint**: All 5 user stories covered, all 11 acceptance scenarios pass, edge cases pass, suite is repeatable and fast

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No prerequisites — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001 must be done so TypeScript types are available)
- **Phase 3–7 (User Stories)**: All depend on Phase 2 completion; can proceed in any order or in parallel
- **Phase 8 (Polish)**: Depends on all story phases (3–7) being complete

### User Story Dependencies

- **US1 (T008)**: No dependency on other stories — uses only `seedSession` from foundational
- **US2 (T009)**: No dependency on other stories — uses only `seedSession`; test creates its own blocks via UI
- **US3 (T010)**: No dependency on other stories — uses only `createBlock` from foundational
- **US4 (T011)**: No dependency on other stories — renders dialog in isolation, no shared state
- **US5 (T012)**: No dependency on other stories — uses only `seedSession`

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can all be written simultaneously (different files)
- **Phase 2**: T006 and T007 can be written simultaneously (different files)
- **Phase 3–7**: After foundational completes, all five story tasks (T008–T012) can be worked simultaneously by different developers
- **Phase 8**: T013 and T014 are independent and can run in parallel

---

## Parallel Example: Phase 1

```
Simultaneously:
  Task T002: Create apps/web/vitest.config.ts
  Task T003: Create apps/web/vitest.setup.ts
  Task T004: Create apps/web/playwright.config.ts
Then:
  Task T001 already done → run T005 (yarn install + playwright install)
```

## Parallel Example: Phases 3–7

```
After Phase 2 completes:
  Developer A: T008 (e2e/auth.spec.ts)
  Developer B: T009 (e2e/block-lifecycle.spec.ts)
  Developer C: T010 (__tests__/blocks-client.test.tsx)
  Developer D: T011 (__tests__/create-block-dialog.test.tsx)
  Developer E: T012 (e2e/profile.spec.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T007)
3. Complete Phase 3: User Story 1 (T008)
4. **STOP and VALIDATE**: `yarn test:e2e --grep "auth"` — 3 green tests
5. All three authentication acceptance scenarios (and FR-001) are now pinned

### Incremental Delivery

1. Setup + Foundational → infra ready
2. T008 (US1 auth) → authentication flow pinned ✅
3. T009 (US2 blocks) → block lifecycle pinned ✅
4. T010 (US3 filtering) → dashboard filtering pinned ✅
5. T011 (US4 validation) → form validation pinned ✅
6. T012 (US5 profile) → profile page pinned ✅
7. T013–T015 (Polish) → edge cases + pipeline + quality validation ✅

---

## Notes

- `[P]` tasks operate on different files and have no mutual dependencies — safe to parallelize
- `[Story]` label maps each task to the spec.md user story for traceability
- All E2E tests use `getByRole`, `getByLabel`, `getByText` — never CSS class selectors (ensures SC-005 stability)
- All RTL tests use `screen.getBy*` queries and `userEvent` for realistic interaction simulation
- Vitest mocks for `next/navigation` and `sonner` must be declared before imports using `vi.mock()` hoisting
- Commit after each task or logical group; each story phase is a natural commit boundary
