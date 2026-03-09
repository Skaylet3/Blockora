# Implementation Plan: Cloudflare Turnstile CAPTCHA Integration

**Branch**: `008-captcha-integration` | **Date**: 2026-03-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-captcha-integration/spec.md`

## Summary

Add Cloudflare Turnstile CAPTCHA verification to all public auth endpoints (register, login, refresh) on both backend and frontend. Backend creates a `TurnstileService` to verify tokens via Cloudflare's siteverify API. Frontend adds Turnstile widgets to login/register forms and invisible execution for token refresh. All existing tests updated to mock CAPTCHA verification. No database changes required.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2023 target, nodenext modules)
**Primary Dependencies**: NestJS 11, Next.js 16, React 19, @marsidev/react-turnstile, class-validator
**Storage**: N/A (CAPTCHA is stateless — no DB changes)
**Testing**: Vitest 3 (both apps), @testing-library/react 16 (frontend)
**Target Platform**: Web (Vercel serverless backend + Next.js frontend)
**Project Type**: Web service (monorepo: apps/api + apps/web)
**Performance Goals**: CAPTCHA verification adds <2s latency to form submissions
**Constraints**: CAPTCHA always enforced (no dev/test bypass), Cloudflare API dependency
**Scale/Scope**: 3 endpoints modified, 2 forms updated, ~10 test files updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Blocks Are Atomic | PASS | No block model changes |
| II. Privacy by Default | PASS | CAPTCHA tokens are ephemeral, not stored. No user data exposure |
| III. Simplicity Over Features | PASS | CAPTCHA is a security hardening of existing features, not a new feature |
| IV. Performance is a Feature | PASS | <2s added latency target. Cloudflare Turnstile is lightweight |
| V. Type-Safe and Test-Driven | PASS | All new code TypeScript strict. All tests updated |
| VI. Monorepo Discipline | PASS | Changes scoped to apps/api and apps/web. No cross-app imports |
| VII. Notes and Storage Hierarchy | PASS | No impact |
| VIII. Tasks System | PASS | No impact |

**Post-Phase 1 re-check**: All gates still pass. No new dependencies violate constitution. `@marsidev/react-turnstile` is a lightweight React wrapper (MIT), not a framework change.

## Project Structure

### Documentation (this feature)

```text
specs/008-captcha-integration/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-endpoints.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
apps/api/
├── src/
│   ├── captcha/                          # NEW module
│   │   ├── captcha.module.ts             # NestJS module exporting TurnstileService
│   │   ├── turnstile.service.ts          # Cloudflare siteverify API call
│   │   └── turnstile.service.spec.ts     # Unit tests
│   ├── auth/
│   │   ├── auth.controller.ts            # MODIFIED (no logic change, DTOs handle token)
│   │   ├── auth.controller.spec.ts       # MODIFIED (mock TurnstileService)
│   │   ├── auth.service.ts               # MODIFIED (inject + call TurnstileService)
│   │   ├── auth.service.spec.ts          # MODIFIED (mock TurnstileService)
│   │   └── dto/
│   │       ├── register.dto.ts           # MODIFIED (add captchaToken)
│   │       ├── login.dto.ts              # MODIFIED (add captchaToken)
│   │       └── refresh.dto.ts            # MODIFIED (add captchaToken)
│   └── config/
│       └── env.ts                        # MODIFIED (add TURNSTILE_SECRET_KEY)

apps/web/
├── src/
│   ├── features/auth/ui/
│   │   ├── login-form.tsx                # MODIFIED (add Turnstile widget)
│   │   └── register-form.tsx             # MODIFIED (add Turnstile widget)
│   ├── shared/api/
│   │   ├── auth.api.ts                   # MODIFIED (add captchaToken to types)
│   │   ├── http-client.ts                # MODIFIED (refresh flow sends captchaToken)
│   │   └── __tests__/
│   │       └── auth.api.test.ts          # MODIFIED (include captchaToken in test data)
│   └── pages-flat/
│       ├── login/ui/__tests__/
│       │   └── login-page.test.tsx        # MODIFIED (mock Turnstile widget)
│       └── register/ui/__tests__/
│           └── register-page.test.tsx     # MODIFIED (mock Turnstile widget)
```

**Structure Decision**: No new apps or packages. New `captcha` module in `apps/api/src/` follows existing NestJS module pattern (same as `auth/`, `block/`, `note/`, etc.). Frontend changes are modifications to existing files plus one new dependency.

## Complexity Tracking

No constitution violations to justify.
