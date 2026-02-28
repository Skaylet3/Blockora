# Feature Specification: Frontend–Backend API Integration

**Feature Branch**: `001-frontend-api-integration`
**Created**: 2026-02-28
**Status**: Draft
**Input**: User description: "we need to integrate backend apis with frontend, no mock data anymore on the frontend, the backend's api is real and deployed, this is the api https://blockora-api.vercel.app/api, you can see all endpoints on the backend 'api' folder, we need to integrate them all, also about the register page, we dont have it yet, but we need to create it in the same style as we have login page, exactly the same, give it a route and integrate, all endpoints should be integrated. Also auth, and so on, everything. Also if we have no delete button or update button or functions, add them and make everything with fsd architecture we have. Also we need to follow solid for the code quality."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and Log In (Priority: P1)

A new visitor opens the app, navigates to the registration page, fills in their email and password, and creates an account. Upon success they are immediately signed in and redirected to the dashboard. An existing user opens the login page, enters valid credentials, and is redirected to the dashboard. Both pages share the same visual style and layout.

**Why this priority**: Authentication is the entry gate to every other feature. Without working register and login, no other user story is reachable.

**Independent Test**: Open the app without being signed in. Navigate to `/register` and create a new account. Verify the user lands on the dashboard with their (empty) block list. Log out and log back in via `/login` using the same credentials.

**Acceptance Scenarios**:

1. **Given** a visitor on `/register`, **When** they submit a valid email and password, **Then** an account is created, they are signed in, and redirected to `/`.
2. **Given** a visitor on `/register`, **When** they submit an already-registered email, **Then** a descriptive error message is shown and no account is created.
3. **Given** a registered user on `/login`, **When** they submit correct credentials, **Then** they are signed in and redirected to `/`.
4. **Given** a registered user on `/login`, **When** they submit wrong credentials, **Then** a descriptive error message is shown and they remain on the login page.
5. **Given** a signed-in user, **When** their access token expires, **Then** the system transparently obtains a new session using the stored refresh token without requiring the user to log in again.
6. **Given** a signed-in user, **When** they click Log Out, **Then** their session is revoked on the server and they are redirected to `/login`.

---

### User Story 2 - View Real Blocks on the Dashboard (Priority: P2)

A signed-in user opens the dashboard and sees their actual blocks fetched from the server. All filtering, search, and tab features continue to work as before, but the data is live rather than hard-coded.

**Why this priority**: The dashboard is the primary content area of the app; removing mock data and showing real data is the core value of this feature.

**Independent Test**: Log in as a user who has created blocks in the backend. Open the dashboard and verify the blocks displayed match those stored in the backend (confirm via direct API query or Swagger UI).

**Acceptance Scenarios**:

1. **Given** a signed-in user with blocks on the server, **When** they open the dashboard, **Then** their blocks are displayed with correct titles, types, statuses, tags, and timestamps.
2. **Given** a signed-in user with no blocks, **When** they open the dashboard, **Then** an appropriate empty-state message is shown.
3. **Given** the server is temporarily unavailable, **When** the user opens the dashboard, **Then** a user-friendly error message is shown and the page does not crash.

---

### User Story 3 - Create a Block (Priority: P3)

A signed-in user opens the create-block dialog, fills in the required fields, and submits. The new block is persisted on the server and immediately appears in their block list.

**Why this priority**: Block creation is the main content-authoring action; it depends on auth (P1) and dashboard display (P2) already working.

**Independent Test**: Log in, open the create-block dialog, fill in a title, and submit. Verify the new block appears in the dashboard list and is retrievable via the backend.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they submit the create-block form with a valid title, **Then** the block is saved to the server and appears in the list immediately.
2. **Given** a signed-in user, **When** they submit the form with missing required fields, **Then** validation errors are shown inline and no server request is made.
3. **Given** a create-block request that fails on the server, **When** the error is returned, **Then** a descriptive toast notification is shown and the dialog remains open with the user's input intact.

---

### User Story 4 - Edit an Existing Block (Priority: P4)

A signed-in user can edit any of their blocks via an edit button visible on each block card. Changes are persisted to the server and reflected immediately in the block list.

**Why this priority**: Block editing completes the update lifecycle and depends on create (P3) being in place first.

**Independent Test**: Log in, locate an existing block, click the edit action, change the title, and save. Verify the updated title is reflected in the list and persists after a page reload.

**Acceptance Scenarios**:

1. **Given** a signed-in user viewing their blocks, **When** they click the edit action on a block and submit changes, **Then** the block is updated on the server and the updated values appear in the list immediately.
2. **Given** an edit request that fails on the server, **When** the error is returned, **Then** the user sees a descriptive error and the original values are preserved.
3. **Given** a signed-in user, **When** they attempt to edit a block they do not own (e.g., via URL manipulation), **Then** an appropriate error is shown and no changes are applied.

---

### User Story 5 - Delete a Block (Priority: P5)

A signed-in user can delete any of their blocks via a delete button on each block card. After confirming, the block is soft-deleted on the server and immediately removed from the visible list.

**Why this priority**: Delete completes full CRUD support; it has no blocking dependencies beyond auth (P1) and dashboard display (P2).

**Independent Test**: Log in, click the delete button on a block, confirm the action, and verify the block is no longer shown in the list. Reload the page and confirm it remains absent.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they confirm deletion of a block, **Then** the block is removed from the server and disappears from the list immediately.
2. **Given** a deletion confirmation prompt, **When** the user cancels, **Then** the block is not deleted and the list is unchanged.
3. **Given** a delete request that fails on the server, **When** the error is returned, **Then** a descriptive error toast is shown and the block remains visible in the list.

---

### User Story 6 - View Profile Information (Priority: P6)

A signed-in user opens their profile page and sees their account information fetched live from the server (email, display name).

**Why this priority**: Profile display is a secondary flow; it requires working auth (P1) and the user identity endpoint.

**Independent Test**: Log in, navigate to `/profile`, and verify that the email displayed matches the account used to log in.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the profile page, **When** the page loads, **Then** their email and display name are fetched from the server and displayed.
2. **Given** a server error when fetching profile, **When** the request fails, **Then** a user-friendly error is shown instead of leaving fields blank.

---

### Edge Cases

- What happens when a user's access token is expired and there is no valid refresh token? The user is redirected to `/login` with a session-expired notification.
- What happens when a network request fails mid-flow (e.g., during block creation)? A descriptive error toast is shown; in-progress form data is preserved so the user does not lose their input.
- What happens when a user opens a protected route without being authenticated? They are redirected to `/login`.
- What happens when an already-authenticated user navigates to `/login` or `/register`? They are redirected to the dashboard.
- What if the server returns a 422 validation error from the backend? The error messages are extracted and shown inline next to the relevant form fields.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `/register` route with a registration page visually identical in style and layout to the existing `/login` page.
- **FR-002**: The system MUST send registration credentials to the backend and display meaningful errors on failure (duplicate email, validation errors).
- **FR-003**: The login form MUST send credentials to the backend login endpoint; the system MUST store the returned access token and refresh token persistently in the browser.
- **FR-004**: The system MUST transparently refresh the access token using the stored refresh token when the access token expires, without user intervention.
- **FR-005**: The logout action MUST call the backend logout endpoint to revoke the server-side refresh token, then clear all locally stored tokens and redirect to `/login`.
- **FR-006**: The dashboard MUST load the authenticated user's blocks from the backend; all filtering, search, and tab functionality MUST work with live data; no mock data paths may remain in the shipped code.
- **FR-007**: The create-block form MUST send new block data to the backend and update the block list on success.
- **FR-008**: Each block card MUST expose an edit action that opens a pre-filled form; submitting MUST send a partial-update request to the backend and reflect changes in the list.
- **FR-009**: Each block card MUST expose a delete action; confirming deletion MUST call the backend delete endpoint and remove the block from the visible list.
- **FR-010**: The profile page MUST fetch the authenticated user's information from the backend and display it.
- **FR-011**: All new and modified frontend code MUST conform to the existing Feature-Sliced Design (FSD) architecture layers: pages-flat → widgets → features → entities → shared; no cross-layer imports may violate FSD rules.
- **FR-012**: All API-calling code MUST follow SOLID principles: single responsibility per module, dependency on abstractions rather than concrete implementations.
- **FR-013**: The system MUST translate all backend error responses (HTTP status codes, error bodies) into user-visible messages (toasts or inline form errors).
- **FR-014**: All protected routes MUST redirect unauthenticated users to `/login`; authenticated users accessing `/login` or `/register` MUST be redirected to the dashboard.

### Key Entities

- **User**: Represents an authenticated account. Attributes: userId, email, displayName (optional). Obtained from the profile endpoint after sign-in.
- **Token Pair**: Represents a valid session. Attributes: accessToken (short-lived), refreshToken (long-lived, stored persistently across browser sessions). Issued on register, login, and refresh.
- **Block**: The main content unit. Attributes: id, title, content, type (categorisation), status (lifecycle state), visibility, tags (array of strings), createdAt, updatedAt. Belongs to one user. Supports full CRUD; deletion is soft (status-based).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete the full registration-to-dashboard flow in under 60 seconds.
- **SC-002**: 100% of UI data interactions call the real backend; zero hard-coded mock data paths remain in the shipped frontend.
- **SC-003**: All 10 backend endpoints (5 auth + 5 block) are exercised through the frontend UI with no need for a manual API client.
- **SC-004**: A user's session persists across browser refreshes without re-login for the duration that the refresh token is valid.
- **SC-005**: All CRUD operations on blocks (create, read, update, delete) complete and are reflected in the UI in under 3 seconds under normal network conditions.
- **SC-006**: 100% of new frontend modules are placed in FSD-compliant directories; zero violations of FSD layer import rules.
- **SC-007**: Any network failure or server error is surfaced to the user within 5 seconds of occurrence via a visible notification.
- **SC-008**: The register page is visually indistinguishable in layout and style from the login page when viewed side-by-side.

## Assumptions

- The deployed backend base URL is `https://blockora-api.vercel.app/api`; the frontend is configured to send all data requests to this base URL.
- Access tokens are short-lived (≤15 minutes) and refresh tokens are long-lived (≤7 days), consistent with the backend implementation.
- Token storage uses the browser's `localStorage` (suitable for this SPA context); httpOnly cookie-based storage is out of scope unless explicitly requested.
- The profile page is read-only for this feature (display only); a profile-update endpoint is not confirmed to exist, so profile editing is deferred to a future feature unless the backend exposes a suitable endpoint.
- The existing `BlockStatus`, `BlockType`, and `BlockVisibility` enum values on the frontend match those defined in the backend DTOs; no frontend type schema changes are required.
- Block deletion requires a user confirmation step (via the existing shared dialog component or a native browser confirm) before the request is sent.
- The register page is served at the `/register` route, consistent with the existing `/login` convention.
- No new backend endpoints need to be created; all integration targets the 10 existing endpoints.
