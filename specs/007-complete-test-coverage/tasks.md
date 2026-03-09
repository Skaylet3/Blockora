# Tasks: Complete Test Coverage Audit

**Input**: Design documents from `/specs/007-complete-test-coverage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/testing-conventions.md

**Tests**: This feature IS about writing tests. All implementation tasks produce test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing test infrastructure and establish baseline coverage

- [x] T001 Verify all existing backend tests pass by running `cd apps/api && yarn vitest run`
- [x] T002 Verify all existing frontend tests pass by running `cd apps/web && yarn vitest run`
- [x] T003 [P] Run backend coverage baseline with `cd apps/api && yarn vitest run --coverage` and record results
- [x] T004 [P] Run frontend coverage baseline with `cd apps/web && yarn vitest run --coverage` and record results

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational blocking tasks needed - test infrastructure already exists in both apps

**Checkpoint**: Existing tests pass, coverage baselines recorded - user story implementation can begin

---

## Phase 3: User Story 1 - Backend Test Coverage Audit (Priority: P1)

**Goal**: Every backend controller endpoint, service method, guard, and decorator has corresponding test coverage

**Independent Test**: Run `cd apps/api && yarn vitest run` and confirm all new test files pass with meaningful assertions

### Backend Missing Tests - Guards & Decorators

- [x] T005 [P] [US1] Create JwtAuthGuard unit tests in apps/api/src/auth/guards/jwt-auth.guard.spec.ts covering canActivate for valid token, missing token, invalid token, and @Public() bypass scenarios
- [x] T006 [P] [US1] Create Public decorator test in apps/api/src/auth/decorators/public.decorator.spec.ts verifying IS_PUBLIC_KEY metadata is set correctly
- [x] T007 [P] [US1] Create CurrentUser decorator test in apps/api/src/auth/decorators/current-user.decorator.spec.ts verifying it extracts user from request object

### Backend Missing Tests - Services

- [x] T008 [P] [US1] Create PrismaService unit tests in apps/api/src/prisma/prisma.service.spec.ts covering onModuleInit, onModuleDestroy, and db accessor

### Backend Coverage Completeness Audit

- [x] T009 [US1] Audit apps/api/src/auth/auth.controller.spec.ts for missing endpoint coverage (register, login, refresh, logout, me) and add any missing test cases
- [x] T010 [P] [US1] Audit apps/api/src/auth/auth.service.spec.ts for missing method coverage and add any missing test cases (error paths, edge cases)
- [x] T011 [P] [US1] Audit apps/api/src/block/block.controller.spec.ts and apps/api/src/block/block.service.spec.ts for missing coverage and add missing test cases
- [x] T012 [P] [US1] Audit apps/api/src/users/users.controller.spec.ts and apps/api/src/users/users.service.spec.ts for missing coverage and add missing test cases
- [x] T013 [P] [US1] Audit apps/api/src/storage/storage.controller.spec.ts and apps/api/src/storage/storage.service.spec.ts for missing coverage and add missing test cases
- [x] T014 [P] [US1] Audit apps/api/src/note/note.controller.spec.ts and apps/api/src/note/note.service.spec.ts for missing coverage and add missing test cases
- [x] T015 [P] [US1] Audit apps/api/src/todo/todo.controller.spec.ts and apps/api/src/todo/todo.service.spec.ts for missing coverage and add missing test cases

### Backend Verification

- [x] T016 [US1] Run full backend test suite with `cd apps/api && yarn vitest run` and confirm all tests pass

**Checkpoint**: All backend controllers, services, guards, and decorators have comprehensive test coverage

---

## Phase 4: User Story 2 - Frontend Test Coverage Audit (Priority: P1)

**Goal**: Every frontend page component, API client, and shared component has corresponding test coverage

**Independent Test**: Run `cd apps/web && yarn vitest run` and confirm all new test files pass with meaningful assertions

### Frontend Missing Tests - Page Components

- [x] T017 [P] [US2] Create LoginPage component tests in apps/web/src/pages-flat/login/ui/__tests__/login-page.test.tsx covering render, form validation, login submission (success + error), and loading state
- [x] T018 [P] [US2] Create RegisterPage component tests in apps/web/src/pages-flat/register/ui/__tests__/register-page.test.tsx covering render, form validation, registration submission (success + error), and loading state
- [x] T019 [P] [US2] Create DashboardPage component tests in apps/web/src/pages-flat/dashboard/ui/__tests__/dashboard-page.test.tsx covering render, block list display, empty state, and error state
- [x] T020 [P] [US2] Create ProfilePage component tests in apps/web/src/pages-flat/profile/ui/__tests__/profile-page.test.tsx covering render, profile display, and integration with profile-form
- [x] T021 [P] [US2] Create TodoPage component tests in apps/web/src/pages-flat/todo/ui/__tests__/todo-page.test.tsx covering render, todo list display, create/update/delete operations, empty state, and error state

### Frontend Missing Tests - API Clients

- [x] T022 [P] [US2] Create Auth API client tests in apps/web/src/shared/api/__tests__/auth.api.test.ts covering login, register, refresh, logout, and getMe functions with success and error responses
- [x] T023 [P] [US2] Create Blocks API client tests in apps/web/src/shared/api/__tests__/blocks.api.test.ts covering all CRUD functions with success and error responses

### Frontend Coverage Completeness Audit

- [x] T024 [P] [US2] Audit apps/web/__tests__/create-block-dialog.test.tsx for missing coverage (open/close, validation, submit success/error) and add missing test cases
- [x] T025 [P] [US2] Audit apps/web/__tests__/blocks-client.test.tsx for missing coverage and add missing test cases
- [x] T026 [P] [US2] Audit apps/web/src/features/update-profile/ui/__tests__/profile-form.test.tsx for missing coverage and add missing test cases
- [x] T027 [P] [US2] Audit apps/web/src/pages-flat/notes/ui/__tests__/notes-page.test.tsx for missing coverage and add missing test cases
- [x] T028 [P] [US2] Audit apps/web/src/shared/api/__tests__/storages.api.test.ts for missing coverage and add missing test cases
- [x] T029 [P] [US2] Audit apps/web/src/shared/api/__tests__/notes.api.test.ts for missing coverage and add missing test cases
- [x] T030 [P] [US2] Audit apps/web/src/shared/api/__tests__/todos.api.test.ts for missing coverage and add missing test cases

### Frontend Verification

- [x] T031 [US2] Run full frontend test suite with `cd apps/web && yarn vitest run` and confirm all tests pass

**Checkpoint**: All frontend pages, API clients, and components have comprehensive test coverage

---

## Phase 5: User Story 3 - Missing Test Identification (Priority: P2)

**Goal**: A documented audit report identifies all tested/untested functionality with risk-based prioritization

**Independent Test**: Review the audit document and confirm it lists all components with their test status

- [x] T032 [US3] Generate backend coverage report with `cd apps/api && yarn vitest run --coverage` and record per-file results
- [x] T033 [US3] Generate frontend coverage report with `cd apps/web && yarn vitest run --coverage` and record per-file results
- [x] T034 [US3] Create audit report in specs/007-complete-test-coverage/audit-report.md listing all backend and frontend components with test status (tested/untested), coverage percentage, and risk priority

**Checkpoint**: Audit report documents all tested/untested functionality with prioritization

---

## Phase 6: User Story 4 - Test Suite Completeness (Priority: P2)

**Goal**: CI pipeline runs full test suite and enforces quality gates on every pull request

**Independent Test**: Verify CI configuration runs tests and blocks PRs on failure

- [x] T035 [US4] Verify turbo.json has a `test` pipeline configured that runs tests in both apps/api and apps/web
- [x] T036 [US4] Verify or add coverage thresholds in apps/api/vitest.config.ts (statements, branches, functions, lines)
- [x] T037 [US4] Verify or add coverage thresholds in apps/web/vitest.config.ts (statements, branches, functions, lines)

**Checkpoint**: CI enforces test execution and coverage thresholds on every PR

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T038 Run complete test suite from repo root to verify no cross-app issues
- [x] T039 Verify test execution time remains under 5 minutes for combined backend + frontend suite
- [x] T040 Run quickstart.md validation steps to confirm all documented commands work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - confirms test infra works
- **US1 Backend (Phase 3)**: Depends on Phase 1 completion
- **US2 Frontend (Phase 4)**: Depends on Phase 1 completion - can run in parallel with Phase 3
- **US3 Audit Report (Phase 5)**: Depends on Phase 3 AND Phase 4 completion (needs final coverage numbers)
- **US4 CI Completeness (Phase 6)**: Depends on Phase 3 AND Phase 4 completion
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Backend tests - no dependency on other stories
- **User Story 2 (P1)**: Frontend tests - no dependency on other stories
- **User Story 3 (P2)**: Audit report - depends on US1 + US2 being complete for accurate coverage data
- **User Story 4 (P2)**: CI gates - depends on US1 + US2 so thresholds reflect actual coverage

### Parallel Opportunities

**Phase 3 (Backend)**: T005, T006, T007, T008 can all run in parallel. T009-T015 can all run in parallel.

**Phase 4 (Frontend)**: T017-T023 can all run in parallel. T024-T030 can all run in parallel.

**Cross-phase**: Phase 3 and Phase 4 can run entirely in parallel (different apps, no file conflicts).

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (verify existing tests)
2. Complete Phase 3: Backend Test Coverage (US1) - in parallel with Phase 4
3. Complete Phase 4: Frontend Test Coverage (US2) - in parallel with Phase 3
4. **STOP and VALIDATE**: Run full test suites in both apps
5. All critical test gaps are filled

### Incremental Delivery

1. Setup (Phase 1) -> Baseline established
2. Backend Tests (Phase 3) + Frontend Tests (Phase 4) -> All P1 gaps filled (MVP!)
3. Audit Report (Phase 5) -> Documentation of coverage status
4. CI Gates (Phase 6) -> Automated enforcement
5. Polish (Phase 7) -> Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are both P1 and can proceed in parallel
- Audit tasks (T009-T015, T024-T030) require reading existing test files first, then adding missing cases
- New test file tasks (T005-T008, T017-T023) create files from scratch following conventions in contracts/testing-conventions.md
