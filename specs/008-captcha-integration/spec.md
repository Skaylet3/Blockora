# Feature Specification: Cloudflare Turnstile CAPTCHA Integration

**Feature Branch**: `008-captcha-integration`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "Implement Cloudflare Turnstile CAPTCHA on registration, login, and all public forms"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CAPTCHA on Registration (Priority: P1)

A new user visits the registration page and fills in their details. A Cloudflare Turnstile widget is displayed within the form. The user completes the challenge (or it passes invisibly in managed mode). Upon submitting, the CAPTCHA token is sent to the backend, which verifies it with Cloudflare's siteverify API before creating the account. If verification fails, the user sees an error and can retry.

**Why this priority**: Registration is the primary target for bot abuse (mass account creation). Protecting it first delivers the most value.

**Independent Test**: Can be tested by attempting to register with a valid Turnstile token (success) and without/with an invalid token (rejection).

**Acceptance Scenarios**:

1. **Given** a user is on the registration page, **When** they complete the form and pass the Turnstile challenge, **Then** the account is created successfully.
2. **Given** a user is on the registration page, **When** they submit the form without completing the Turnstile challenge, **Then** the form submission is blocked with a clear error message.
3. **Given** a user is on the registration page, **When** the Turnstile token is invalid or expired, **Then** the backend rejects the request and returns a descriptive error.

---

### User Story 2 - CAPTCHA on Login (Priority: P1)

A returning user visits the login page. A Turnstile widget is rendered alongside the login form. The user must pass the challenge before their credentials are submitted. The backend verifies the CAPTCHA token before processing the login attempt. This prevents credential-stuffing and brute-force attacks.

**Why this priority**: Login is the second most targeted endpoint for automated abuse. Equal priority with registration.

**Independent Test**: Can be tested by attempting to log in with valid credentials + valid token (success), valid credentials + missing/invalid token (rejection).

**Acceptance Scenarios**:

1. **Given** a user is on the login page, **When** they enter valid credentials and pass the Turnstile challenge, **Then** they are logged in successfully.
2. **Given** a user is on the login page, **When** they submit valid credentials without a valid Turnstile token, **Then** the login is rejected with an error indicating CAPTCHA failure.
3. **Given** a user is on the login page, **When** the Turnstile service is temporarily unavailable, **Then** the system gracefully handles the failure and informs the user to retry.

---

### User Story 3 - CAPTCHA on Token Refresh (Priority: P2)

The token refresh endpoint is public and could be abused for token farming. A Turnstile token is required when calling the refresh endpoint. Since refresh is typically called programmatically (not via a visible form), the frontend obtains a Turnstile token via the invisible/managed widget before making the refresh call.

**Why this priority**: Lower abuse risk than registration/login but still a public endpoint worth protecting.

**Independent Test**: Can be tested by calling the refresh endpoint with and without a valid Turnstile token.

**Acceptance Scenarios**:

1. **Given** a user's access token has expired, **When** the frontend automatically requests a refresh with a valid Turnstile token, **Then** new tokens are issued.
2. **Given** an attacker calls the refresh endpoint without a Turnstile token, **Then** the request is rejected.

---

### User Story 4 - Existing Tests Updated for CAPTCHA (Priority: P1)

All existing unit and integration tests for registration, login, and refresh endpoints must be updated to include CAPTCHA token handling. Tests must always provide a valid CAPTCHA token (or mock the verification) so that the test suite continues to pass. CAPTCHA verification is always enforced, including in test environments.

**Why this priority**: Without updating tests, the entire test suite breaks when CAPTCHA is added. This is a prerequisite for safe deployment.

**Independent Test**: Run the full test suite; all existing and new tests pass with CAPTCHA verification properly handled.

**Acceptance Scenarios**:

1. **Given** CAPTCHA is integrated, **When** the existing test suite runs, **Then** all tests pass with CAPTCHA verification properly handled.
2. **Given** a new test is written for a CAPTCHA-protected endpoint, **When** no CAPTCHA token is provided in the test, **Then** the test correctly expects a rejection response.

---

### Edge Cases

- What happens when Cloudflare's siteverify API is down or unreachable? The system should return a clear error asking the user to retry, not silently fail open.
- What happens when a user submits a CAPTCHA token that has already been used? The backend should reject it (Cloudflare tokens are single-use).
- What happens when the Turnstile widget fails to load on the frontend (e.g., ad blocker)? The user should see a message explaining that CAPTCHA is required and suggesting they disable content blockers.
- What happens when the CAPTCHA token expires before form submission? The widget should automatically refresh, or the user should be prompted to re-verify.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a Cloudflare Turnstile widget on the registration form.
- **FR-002**: System MUST display a Cloudflare Turnstile widget on the login form.
- **FR-003**: System MUST obtain a Turnstile token for the token refresh flow (invisible/managed mode).
- **FR-004**: System MUST send the Turnstile token alongside the form payload to the backend for all protected endpoints (register, login, refresh).
- **FR-005**: Backend MUST verify the Turnstile token with Cloudflare's siteverify API before processing the request.
- **FR-006**: Backend MUST reject requests with missing, invalid, or expired Turnstile tokens with an appropriate error response.
- **FR-007**: System MUST handle Turnstile widget load failures gracefully, showing a user-friendly message.
- **FR-008**: System MUST handle Cloudflare siteverify API failures gracefully, returning a retry-able error to the user.
- **FR-009**: All existing tests for protected endpoints MUST be updated to handle CAPTCHA tokens (via mocking or Cloudflare test keys).
- **FR-010**: CAPTCHA verification MUST always be enforced regardless of environment (no dev/test bypass).

### Key Entities

- **Turnstile Token**: A single-use, time-limited token generated client-side by the Cloudflare Turnstile widget, sent to the backend for server-side verification.
- **Site Key**: Public key used by the frontend widget to render the challenge (configured per environment).
- **Secret Key**: Private key used by the backend to verify tokens with Cloudflare's siteverify API (stored securely, never exposed to the client).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All public form submissions (registration, login, refresh) require a valid CAPTCHA challenge completion before processing.
- **SC-002**: Bot-driven registration attempts are blocked — automated submissions without valid CAPTCHA tokens receive rejection responses.
- **SC-003**: Legitimate users can complete registration and login flows with less than 2 seconds of additional delay from CAPTCHA verification.
- **SC-004**: The full test suite passes with CAPTCHA enforcement active, with no test requiring CAPTCHA to be disabled.
- **SC-005**: When the CAPTCHA widget fails to load or the verification service is unavailable, users see clear, actionable error messages.

## Assumptions

- Cloudflare Turnstile "managed" mode will be used, which automatically decides between invisible and interactive challenges based on risk signals.
- Cloudflare provides test site keys and secret keys for use in automated testing (documented at developers.cloudflare.com).
- The Turnstile site key will differ between development and production environments.
- Token refresh will use an invisible Turnstile execution since there is no visible form interaction.
