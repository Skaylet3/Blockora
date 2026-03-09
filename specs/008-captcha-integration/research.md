# Research: Cloudflare Turnstile CAPTCHA Integration

## Decision 1: Turnstile Widget Mode

**Decision**: Use "managed" mode for login/register forms, "invisible" mode for token refresh.

**Rationale**: Managed mode lets Cloudflare decide whether to show an interactive challenge based on risk signals — best UX for visible forms. Invisible mode is necessary for the programmatic refresh flow since there's no visible form.

**Alternatives considered**:
- Always invisible: Less protection, Cloudflare can't escalate to interactive challenge
- Always managed: Doesn't work for programmatic refresh calls

## Decision 2: Backend Verification Approach

**Decision**: Create a dedicated `TurnstileService` in a new `apps/api/src/captcha/` module that calls Cloudflare's `https://challenges.cloudflare.com/turnstile/v0/siteverify` endpoint. Inject it into `AuthService` and verify before processing register/login/refresh.

**Rationale**: Encapsulates CAPTCHA logic in a single service, easy to mock in tests, follows NestJS module patterns already in use.

**Alternatives considered**:
- Guard-based approach: Would require a custom guard per endpoint with access to request body — more complex, harder to provide specific error messages
- Middleware: Runs before pipes/validation, would need raw body parsing — too early in the pipeline
- Decorator + interceptor: Overly abstract for 3 endpoints

## Decision 3: DTO Field Name

**Decision**: Add `captchaToken: string` field (required, `@IsString()`, `@IsNotEmpty()`) to `RegisterDto`, `LoginDto`, and `RefreshDto`.

**Rationale**: Consistent naming, clearly identifies the field's purpose. Required (not optional) since CAPTCHA is always enforced per spec (FR-010).

## Decision 4: Frontend Widget Library

**Decision**: Use the official `@marsidev/react-turnstile` React component (MIT, well-maintained, TypeScript support).

**Rationale**: Handles widget lifecycle (render, token callbacks, expiry, error), ref-based imperative API for reset/execute. Avoids manual script injection and DOM management.

**Alternatives considered**:
- Manual `<script>` tag + `window.turnstile.render()`: More boilerplate, no React lifecycle integration
- `react-turnstile` (another package): Less maintained, fewer features

## Decision 5: Error Handling for Turnstile Failures

**Decision**:
- Invalid/missing/expired token → 403 Forbidden with message "CAPTCHA verification failed"
- Cloudflare API unreachable → 503 Service Unavailable with message "CAPTCHA service unavailable, please retry"

**Rationale**: 403 differentiates from 401 (auth failure) and 422 (validation). 503 signals a transient upstream failure.

## Decision 6: Test Strategy

**Decision**: Mock `TurnstileService.verify()` in all unit tests. Use Cloudflare's test keys (`1x0000000000000000000000000000000AA` / `1x0000000000000000000000000000000AA`) for any integration tests. Always enforce CAPTCHA — no env-based bypass.

**Rationale**: Mocking the service is standard NestJS test practice. Cloudflare provides dedicated test site/secret keys that always pass or always fail, enabling deterministic testing.

## Decision 7: Environment Variables

**Decision**:
- Backend: `TURNSTILE_SECRET_KEY` (added to Zod env schema, required)
- Frontend: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (used in React component)

**Rationale**: Follows existing env var patterns. `NEXT_PUBLIC_` prefix required by Next.js for client-side exposure.
