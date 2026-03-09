# Tasks: Cloudflare Turnstile CAPTCHA Integration

**Input**: Design documents from `/specs/008-captcha-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — spec requires updating all existing tests (FR-009, US4).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment variables

- [x] T001 Install `@marsidev/react-turnstile` in `apps/web/package.json`
- [x] T002 Add `TURNSTILE_SECRET_KEY` to Zod env schema in `apps/api/src/config/env.ts` (required string)
- [x] T003 Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to frontend environment config

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the backend CAPTCHA module that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `apps/api/src/captcha/captcha.module.ts` — NestJS module that exports `TurnstileService`, imports `ConfigModule`
- [x] T005 Create `apps/api/src/captcha/turnstile.service.ts` — injectable service with `verify(token: string): Promise<void>` method that calls Cloudflare's `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` and `response` fields. Throw `ForbiddenException('CAPTCHA verification failed')` on `success: false`. Throw `ServiceUnavailableException('CAPTCHA service unavailable, please retry')` on network/fetch errors. Inject `TURNSTILE_SECRET_KEY` from `APP_CONFIG`.
- [x] T006 Import `CaptchaModule` in `apps/api/src/app.module.ts`
- [x] T007 Create unit tests in `apps/api/src/captcha/turnstile.service.spec.ts` — test success case, invalid token (403), Cloudflare API unreachable (503). Mock `fetch` globally.

**Checkpoint**: TurnstileService ready — user story implementation can begin

---

## Phase 3: User Story 1 — CAPTCHA on Registration (Priority: P1) MVP

**Goal**: Registration form requires a valid Turnstile CAPTCHA token before account creation

**Independent Test**: Submit registration with valid token (201), without token (422), with invalid token (403)

### Implementation for User Story 1

- [x] T008 [US1] Add `captchaToken` field (`@IsString()`, `@IsNotEmpty()`, `@ApiProperty()`) to `apps/api/src/auth/dto/register.dto.ts`
- [x] T009 [US1] Inject `TurnstileService` into `AuthService` in `apps/api/src/auth/auth.service.ts` — call `this.turnstileService.verify(dto.captchaToken)` at the start of `register()` method, before any other logic
- [x] T010 [US1] Add Turnstile widget to `apps/web/src/features/auth/ui/register-form.tsx` — import `Turnstile` from `@marsidev/react-turnstile`, render below form fields with `siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}`, store token in state via `onSuccess` callback, pass `captchaToken` in the register API call body. Disable submit button until token is obtained. Show error message on `onError`/`onExpire` callbacks.
- [x] T011 [US1] Update `RegisterBody` type in `apps/web/src/shared/api/auth.api.ts` to include `captchaToken: string`

### Tests for User Story 1

- [x] T012 [P] [US1] Update `apps/api/src/auth/auth.service.spec.ts` — add `TurnstileService` to test module providers as a mock (`{ verify: vi.fn() }`). Update all register test cases to include `captchaToken` in DTO. Add test: register with CAPTCHA failure throws ForbiddenException.
- [x] T013 [P] [US1] Update `apps/api/src/auth/auth.controller.spec.ts` — add `TurnstileService` mock to providers. Update register test cases to include `captchaToken` in request body.
- [x] T014 [P] [US1] Update `apps/web/src/pages-flat/register/ui/__tests__/register-page.test.tsx` — mock `@marsidev/react-turnstile` to auto-call `onSuccess` with a test token. Verify `captchaToken` is included in API call. Add test: submit disabled when no CAPTCHA token.
- [x] T015 [P] [US1] Update `apps/web/src/shared/api/__tests__/auth.api.test.ts` — update register test data to include `captchaToken` field.

**Checkpoint**: Registration with CAPTCHA fully functional and tested

---

## Phase 4: User Story 2 — CAPTCHA on Login (Priority: P1)

**Goal**: Login form requires a valid Turnstile CAPTCHA token before credential verification

**Independent Test**: Submit login with valid credentials + valid token (200), valid credentials + missing token (422), valid credentials + invalid token (403)

### Implementation for User Story 2

- [x] T016 [US2] Add `captchaToken` field (`@IsString()`, `@IsNotEmpty()`, `@ApiProperty()`) to `apps/api/src/auth/dto/login.dto.ts`
- [x] T017 [US2] Call `this.turnstileService.verify(dto.captchaToken)` at the start of `login()` method in `apps/api/src/auth/auth.service.ts`
- [x] T018 [US2] Add Turnstile widget to `apps/web/src/features/auth/ui/login-form.tsx` — same pattern as register form (widget, state, onSuccess/onError/onExpire, disable submit until token obtained, pass `captchaToken` in login API call body)
- [x] T019 [US2] Update `LoginBody` type in `apps/web/src/shared/api/auth.api.ts` to include `captchaToken: string`

### Tests for User Story 2

- [x] T020 [P] [US2] Update login test cases in `apps/api/src/auth/auth.service.spec.ts` — include `captchaToken` in DTO. Add test: login with CAPTCHA failure throws ForbiddenException.
- [x] T021 [P] [US2] Update login test cases in `apps/api/src/auth/auth.controller.spec.ts` — include `captchaToken` in request body.
- [x] T022 [P] [US2] Update `apps/web/src/pages-flat/login/ui/__tests__/login-page.test.tsx` — mock `@marsidev/react-turnstile`, verify `captchaToken` in API call.
- [x] T023 [P] [US2] Update login test data in `apps/web/src/shared/api/__tests__/auth.api.test.ts` to include `captchaToken`.

**Checkpoint**: Login with CAPTCHA fully functional and tested

---

## Phase 5: User Story 3 — CAPTCHA on Token Refresh (Priority: P2)

**Goal**: Token refresh endpoint requires a valid Turnstile token, obtained via invisible widget execution

**Independent Test**: Call refresh endpoint with valid refresh token + valid CAPTCHA token (200), without CAPTCHA token (422)

### Implementation for User Story 3

- [x] T024 [US3] Add `captchaToken` field (`@IsString()`, `@IsNotEmpty()`, `@ApiProperty()`) to `apps/api/src/auth/dto/refresh.dto.ts`
- [x] T025 [US3] Call `this.turnstileService.verify(dto.captchaToken)` at the start of `refresh()` method in `apps/api/src/auth/auth.service.ts`
- [x] T026 [US3] Update `apps/web/src/shared/api/http-client.ts` — in the automatic token refresh flow, obtain a Turnstile token via invisible execution (`window.turnstile.execute()` or a pre-rendered invisible widget) and include `captchaToken` in the refresh API call body
- [x] T027 [US3] Update `RefreshBody` type in `apps/web/src/shared/api/auth.api.ts` to include `captchaToken: string`

### Tests for User Story 3

- [x] T028 [P] [US3] Update refresh test cases in `apps/api/src/auth/auth.service.spec.ts` — include `captchaToken` in DTO. Add test: refresh with CAPTCHA failure throws ForbiddenException.
- [x] T029 [P] [US3] Update refresh test cases in `apps/api/src/auth/auth.controller.spec.ts` — include `captchaToken` in request body.
- [x] T030 [P] [US3] Update refresh test data in `apps/web/src/shared/api/__tests__/auth.api.test.ts` to include `captchaToken`.

**Checkpoint**: All three endpoints protected with CAPTCHA

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T031 Run full backend test suite (`cd apps/api && yarn test`) — verify all tests pass
- [x] T032 Run full frontend test suite (`cd apps/web && yarn test`) — verify all tests pass
- [x] T033 Run quickstart.md validation — verify end-to-end flow works with Cloudflare test keys
- [x] T034 Update Swagger API docs — verify `captchaToken` appears in request schemas for register, login, and refresh endpoints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 Registration (Phase 3)**: Depends on Phase 2
- **US2 Login (Phase 4)**: Depends on Phase 2 (can run in parallel with US1)
- **US3 Refresh (Phase 5)**: Depends on Phase 2 (can run in parallel with US1/US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Registration)**: Independent — no dependencies on other stories
- **US2 (Login)**: Independent — no dependencies on other stories
- **US3 (Refresh)**: Independent — no dependencies on other stories
- **US4 (Test Updates)**: Embedded within US1, US2, US3 test tasks — no separate phase needed

### Within Each User Story

- DTOs before service changes
- Service changes before frontend changes
- Frontend changes before tests (tests mock the components)
- All test tasks within a story marked [P] — can run in parallel

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different apps/files)
- T004, T005 can run in parallel (different files in same module)
- US1, US2, US3 can all start in parallel after Phase 2
- All [P] test tasks within each story can run in parallel

---

## Parallel Example: User Story 1

```bash
# After T008-T011 implementation, launch all US1 tests in parallel:
Task: "T012 Update auth.service.spec.ts for register CAPTCHA"
Task: "T013 Update auth.controller.spec.ts for register CAPTCHA"
Task: "T014 Update register-page.test.tsx with Turnstile mock"
Task: "T015 Update auth.api.test.ts register data"
```

## Parallel Example: All User Stories

```bash
# After Phase 2 (Foundational), launch all stories in parallel:
Story 1: T008 → T009 → T010 → T011 → [T012, T013, T014, T015]
Story 2: T016 → T017 → T018 → T019 → [T020, T021, T022, T023]
Story 3: T024 → T025 → T026 → T027 → [T028, T029, T030]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T007)
3. Complete Phase 3: US1 Registration (T008–T015)
4. **STOP and VALIDATE**: Register with CAPTCHA works, tests pass
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → CAPTCHA module ready
2. Add US1 (Registration) → Test → Deploy (MVP!)
3. Add US2 (Login) → Test → Deploy
4. Add US3 (Refresh) → Test → Deploy
5. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 (Test Updates) is not a separate phase — test tasks are embedded in US1, US2, US3
- Cloudflare test keys: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` (always pass)
- CAPTCHA is always enforced — no env-based bypass (FR-010)
- Commit after each task or logical group
