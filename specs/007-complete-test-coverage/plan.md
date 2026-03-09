# Implementation Plan: Complete Test Coverage Audit

**Branch**: `007-complete-test-coverage` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-complete-test-coverage/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

This feature performs a comprehensive audit of all existing functionality across the frontend (Next.js) and backend (NestJS) to identify gaps in test coverage, then implements missing tests to achieve 100% coverage of all controller endpoints, service methods, page components, and API clients. The audit will produce a documented report before implementation begins.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**:
  - Backend: NestJS 11, Vitest 3, @nestjs/testing, unplugin-swc
  - Frontend: Next.js 16, React 19, Vitest 3, @testing-library/react 16, jsdom
**Storage**: PostgreSQL via Prisma 7 (tested via mocked PrismaService)
**Testing**: Vitest 3 (unit/component), Playwright 1.50 (E2E)
**Target Platform**: Node.js 18+ (backend), Modern browsers (frontend)
**Project Type**: Full-stack web application (Turborepo monorepo)
**Performance Goals**: Complete test suite runs in under 5 minutes
**Constraints**: Tests must not depend on execution order; mocks must not leak between tests
**Scale/Scope**: ~30 API endpoints, ~50 service methods, ~15 page components, ~20 API client functions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle V - Type-Safe and Test-Driven ✓

This feature directly implements the constitution mandate: "Any new feature MUST have accompanying tests before the implementation is considered complete." By auditing and filling test gaps, we ensure the entire codebase meets this principle.

### Principle VI - Monorepo Discipline ✓

Tests will be organized within each app (`apps/api`, `apps/web`) following existing patterns. No cross-app test dependencies outside of `packages/`.

## Project Structure

### Documentation (this feature)

```text
specs/007-complete-test-coverage/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/api/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   └── *.spec.ts
│   ├── block/
│   │   ├── block.controller.ts
│   │   ├── block.service.ts
│   │   └── *.spec.ts
│   ├── users/
│   ├── storage/
│   ├── note/
│   ├── todo/
│   └── prisma/
├── test/
│   └── [E2E test files]
├── vitest.config.ts
└── playwright.config.ts

apps/web/
├── src/
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── page.tsx (dashboard)
│   │   ├── profile/page.tsx
│   │   ├── notes/page.tsx
│   │   └── todo/page.tsx
│   ├── pages-flat/
│   │   ├── login/ui/
│   │   ├── dashboard/ui/
│   │   ├── notes/ui/
│   │   └── todo/ui/
│   ├── shared/api/
│   │   ├── auth.api.ts
│   │   ├── blocks.api.ts
│   │   ├── storages.api.ts
│   │   ├── notes.api.ts
│   │   └── todos.api.ts
│   └── features/
├── e2e/
│   └── [Playwright E2E specs]
├── __tests__/
│   └── [Component tests]
├── vitest.config.ts
└── playwright.config.ts
```

**Structure Decision**: Standard Turborepo monorepo with separate test locations per app:
- Backend: `src/**/*.spec.ts` for unit/integration tests
- Frontend: `**/__tests__/**/*.test.tsx` for component tests, `e2e/` for Playwright

### Test File Locations

| Component Type | Test Pattern | Location |
|---------------|--------------|----------|
| Backend Controllers | `*.controller.spec.ts` | `apps/api/src/**/` |
| Backend Services | `*.service.spec.ts` | `apps/api/src/**/` |
| Frontend Pages | `*.test.tsx` | `apps/web/__tests__/` or `apps/web/src/**/__tests__/` |
| Frontend Components | `*.test.tsx` | `apps/web/src/**/__tests__/` |
| API Clients | `*.api.test.ts` | `apps/web/src/shared/api/__tests__/` |
| E2E Tests | `*.spec.ts` | `apps/web/e2e/` |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. This feature directly implements Principle V (Type-Safe and Test-Driven).
