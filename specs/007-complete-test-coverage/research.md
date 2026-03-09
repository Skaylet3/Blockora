# Research: Complete Test Coverage Audit

**Feature**: Complete Test Coverage Audit
**Date**: 2026-03-07
**Branch**: `007-complete-test-coverage`

---

## Phase 0: Outline & Research

### Existing Test Infrastructure

#### Backend (apps/api)

**Testing Framework**: Vitest 3 with @nestjs/testing
**Config**: `vitest.config.ts` with unplugin-swc for NestJS decorator support
**Test Pattern**: `src/**/*.spec.ts`
**Environment**: Node.js
**Coverage**: v8 provider, outputs to `../coverage`

**Existing Test Files**:
```
src/auth/auth.service.spec.ts        ✓ Has tests
src/auth/auth.controller.spec.ts     ✓ Has tests
src/block/block.service.spec.ts      ✓ Has tests
src/block/block.controller.spec.ts   ✓ Has tests
src/users/users.controller.spec.ts   ✓ Has tests
src/users/users.service.spec.ts      ✓ Has tests
src/storage/storage.service.spec.ts  ✓ Has tests
src/storage/storage.controller.spec.ts ✓ Has tests
src/note/note.service.spec.ts        ✓ Has tests
src/note/note.controller.spec.ts     ✓ Has tests
src/todo/todo.controller.spec.ts     ✓ Has tests
src/todo/todo.service.spec.ts        ✓ Has tests
src/app.controller.spec.ts           ✓ Has tests
src/config/env.spec.ts               ✓ Has tests
```

**Backend Testing Patterns**:
1. **Controller Tests**: Use `Test.createTestingModule`, mock services with `useValue`
2. **Service Tests**: Mock PrismaService with `{ db: {...}, $connect: fn, $disconnect: fn }`
3. **E2E Tests**: Use real JWT tokens, override guards don't work for APP_GUARD

#### Frontend (apps/web)

**Testing Framework**: Vitest 3 with @testing-library/react
**Config**: `vitest.config.ts` with @vitejs/plugin-react, jsdom environment
**Test Pattern**: `**/__tests__/**/*.test.tsx` and `**/__tests__/**/*.test.ts`
**Environment**: jsdom

**Existing Test Files**:
```
__tests__/create-block-dialog.test.tsx                    ✓ Has tests
__tests__/blocks-client.test.tsx                          ✓ Has tests
src/features/update-profile/ui/__tests__/profile-form.test.tsx ✓ Has tests
src/pages-flat/notes/ui/__tests__/notes-page.test.tsx     ✓ Has tests
src/shared/api/__tests__/storages.api.test.ts             ✓ Has tests
src/shared/api/__tests__/notes.api.test.ts                ✓ Has tests
src/shared/api/__tests__/todos.api.test.ts                ✓ Has tests
```

**E2E Tests** (Playwright):
```
e2e/auth.spec.ts                    ✓ Has tests
e2e/block-lifecycle.spec.ts         ✓ Has tests
e2e/profile.spec.ts                 ✓ Has tests
```

**Frontend Testing Patterns**:
1. **Component Tests**: Use `render()` from @testing-library/react, mock API calls
2. **API Client Tests**: Mock `fetch` or use MSW pattern with mocked responses
3. **E2E Tests**: Use Playwright with real browser automation

---

### Missing Test Coverage Analysis

#### Backend Gaps Identified

| Component | Status | Missing Coverage |
|-----------|--------|------------------|
| auth/guards/jwt-auth.guard.ts | ❌ | No guard-specific tests (integration tested via controllers) |
| auth/decorators/ | ❌ | No decorator tests (public.decorator.ts, current-user.decorator.ts) |
| prisma/prisma.service.ts | ❌ | No dedicated service tests |
| Middleware (if any) | ❓ | Need to check for custom middleware |

#### Frontend Gaps Identified

| Component | Status | Missing Coverage |
|-----------|--------|------------------|
| pages-flat/login/ui/login-page.tsx | ❌ | No component tests |
| pages-flat/register/ui/register-page.tsx | ❌ | No component tests |
| pages-flat/dashboard/ui/dashboard-page.tsx | ❌ | No component tests (some coverage in blocks-client.test.tsx) |
| pages-flat/profile/ui/profile-page.tsx | ❌ | Only profile-form tested, not full page |
| pages-flat/todo/ui/todo-page.tsx | ❌ | No component tests |
| shared/api/auth.api.ts | ❌ | No dedicated API tests (uses blocks-client) |
| shared/api/blocks.api.ts | ❌ | Partial coverage in blocks-client.test.tsx |
| Custom hooks | ❓ | Need to audit for any custom hooks |

#### E2E Test Gaps

| Flow | Status | Notes |
|------|--------|-------|
| Notes page | ❌ | No E2E coverage |
| Todo page | ❌ | No E2E coverage |
| Storage management | ❌ | No E2E coverage |
| Registration flow | ❓ | Check if covered in auth.spec.ts |

---

### Testing Best Practices (Research Findings)

#### Backend Best Practices

1. **Unit Test Services**: Test business logic in isolation with mocked Prisma
2. **Integration Test Controllers**: Test HTTP layer with mocked services
3. **Test Error Paths**: Verify 400, 401, 404, 422 responses
4. **JWT Testing**: Use real tokens in E2E, mock guards in unit tests
5. **Database**: Never hit real DB in unit tests; use mocked PrismaService

#### Frontend Best Practices

1. **Component Testing**: Test user interactions, not implementation details
2. **API Testing**: Mock at fetch level or use MSW for integration-style tests
3. **Error States**: Test loading, error, and empty states
4. **Accessibility**: Use @testing-library queries that match user behavior
5. **E2E**: Cover critical user journeys end-to-end

---

## Research Decisions

### Decision: Test Scope

**Decision**: Focus on unit/component tests for missing coverage; E2E tests only for critical new flows.

**Rationale**:
- Existing E2E tests cover primary auth and block flows
- Component tests provide faster feedback
- Unit tests catch logic errors early

**Alternatives considered**:
- Add comprehensive E2E for all pages: Rejected due to maintenance overhead and slower execution
- Focus only on coverage metrics: Rejected because coverage != quality; need meaningful tests

### Decision: Mocking Strategy

**Decision**: Continue existing patterns — Jest-style mocks for backend, fetch mocks for frontend.

**Rationale**:
- Consistent with existing codebase
- Well-documented in NestJS and React Testing Library docs
- No need to introduce new dependencies

### Decision: Test Organization

**Decision**: Keep existing file organization patterns.

**Rationale**:
- Backend: Co-located `*.spec.ts` files
- Frontend: `__tests__` directories near source
- No need to restructure existing working tests

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Flaky tests from improper mocking | Medium | High | Use clearMocks: true, proper setup/teardown |
| Test execution time increases | Medium | Medium | Run in parallel where possible, mock expensive operations |
| Existing tests break during changes | Low | High | Run full suite before PR, CI enforcement |
| Coverage threshold too strict | Low | Medium | Start with 80% target, increase gradually |

---

## Prerequisites for Implementation

1. **Verify existing tests pass**: Run `npm test` in both apps before adding new tests
2. **Document current coverage**: Use `vitest run --coverage` to establish baseline
3. **Review existing patterns**: Study 2-3 existing test files to understand conventions
4. **Create audit document**: List all tested/untested functionality before writing tests

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Should we test private methods? | No — test public API, private methods covered indirectly |
| Should we test DTOs? | No — validation covered by class-validator integration tests |
| Should we test React hooks in isolation? | Only if complex; otherwise test via components |
| What coverage threshold? | 100% for this feature (as specified) |
