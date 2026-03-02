# Implementation Plan: User Profile Update

**Branch**: `003-profile-update` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-profile-update/spec.md`

## Summary

Add a `PATCH /users/me` endpoint to the NestJS backend within a new `UsersModule`, enabling
authenticated users to partially update their profile fields (initially `displayName`). Extend
`GET /auth/me` to return `displayName`. Wire the existing (stub) Profile Settings form on the
Next.js frontend to call these endpoints: add a "Name" input field, make Save functional, and
make Cancel restore the last saved state.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode) — both apps
**Primary Dependencies**:
- Backend: NestJS 11, class-validator, class-transformer, @nestjs/swagger, Prisma 7
- Frontend: Next.js 16, React 19, Sonner (toasts), native `fetch` via shared http-client
**Storage**: PostgreSQL via Prisma — no migration needed (`displayName String?` already exists)
**Testing**: Jest (backend unit/e2e), Vitest + @testing-library/react (frontend) — tests not in
scope for this feature unless separately requested
**Target Platform**: Vercel (web), Vercel Lambda (API)
**Project Type**: Full-stack web application (Turborepo monorepo)
**Performance Goals**: Profile update completes in <5 s end-to-end; `GET /auth/me` adds one
indexed DB read by primary key — negligible overhead
**Constraints**: No JWT changes; no DB migration; frontend Cancel must not make a server request
**Scale/Scope**: Single-user profile; 2 backend files new, 2 modified; 2 frontend files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Blocks Are Atomic | ✅ Pass | Block model untouched |
| II — Privacy by Default | ✅ Pass | `PATCH /users/me` scoped to `@CurrentUser()` — only the owner can update their profile |
| III — Simplicity Over Features | ✅ Pass | Profile update is in confirmed MVP scope |
| IV — Performance is a Feature | ✅ Pass | One indexed PK read on GET /auth/me; one PK write on PATCH /users/me |
| V — Type-Safe and Test-Driven | ✅ Pass | All new code in TypeScript strict mode; DTOs validated with class-validator |
| VI — Monorepo Discipline | ✅ Pass | Backend changes in `apps/api`, frontend in `apps/web`; no cross-app imports |

*Post-design re-check*: All principles remain satisfied. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-profile-update/
├── plan.md              # This file
├── research.md          # Phase 0 — architectural decisions
├── data-model.md        # Phase 1 — DTO and entity reference
├── quickstart.md        # Phase 1 — manual validation steps
├── contracts/
│   └── api-contracts.md # Phase 1 — endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code Changes

```text
apps/api/src/
├── users/                              ← NEW module
│   ├── users.module.ts
│   ├── users.controller.ts             ← PATCH /users/me
│   ├── users.service.ts                ← updateProfile(), getProfile()
│   └── dto/
│       ├── update-profile.dto.ts       ← { displayName?: string }
│       └── profile-response.dto.ts     ← { userId, email, displayName? }
├── auth/
│   ├── auth.controller.ts              ← MODIFY: me() now calls UsersService
│   ├── auth.module.ts                  ← MODIFY: imports UsersModule
│   └── dto/
│       └── me-response.dto.ts          ← MODIFY: add displayName field
└── app.module.ts                       ← MODIFY: import UsersModule

apps/web/src/
├── shared/api/
│   └── auth.api.ts                     ← MODIFY: add displayName to User, add updateProfile()
├── features/update-profile/ui/
│   └── profile-form.tsx                ← MODIFY: add Name field, wire Save/Cancel
└── pages-flat/profile/ui/
    └── profile-page.tsx                ← MODIFY: pass initialDisplayName prop
```

**Structure Decision**: Option 2 (web application) — Turborepo monorepo with `apps/api`
(NestJS backend) and `apps/web` (Next.js frontend). A new `UsersModule` is introduced in
the backend following the established `BlockModule` pattern.

## Complexity Tracking

> No constitution violations — section left empty per template instructions.
