# Feature Specification: Backend API — Auth, Blocks, CORS, Docs & Config

**Feature Branch**: `001-api-auth-swagger`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "we need real endpoints for auth and for blocks, also we need to configure backend to be able to talk with frontend(cors), also we need swagger, document all endpoints with swagger with best practices, also create tests for that endpoints, also create production ready .env and .env.example and use zod to type the .env file"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Registration and Login (Priority: P1)

A new visitor can create an account with their email and password. An existing user can log in with their credentials and receive session tokens that allow access to protected resources. The session can be refreshed silently before expiry, so users are not unexpectedly logged out.

**Why this priority**: Authentication is the foundation — nothing else in the system is accessible without a verified identity. All other stories depend on this working correctly.

**Independent Test**: Can be fully tested by submitting valid registration and login requests and verifying that a valid session token is returned, and that subsequent requests using that token reach protected endpoints.

**Acceptance Scenarios**:

1. **Given** a visitor with a unique email address, **When** they submit a registration request with email and password, **Then** their account is created and they receive a session token.
2. **Given** a registered user, **When** they submit correct credentials, **Then** they receive a valid access token and refresh token.
3. **Given** a registered user, **When** they submit incorrect credentials, **Then** they receive an error indicating the credentials are invalid, with no token issued.
4. **Given** an attempt to register with an already-registered email, **When** the request is submitted, **Then** the system rejects it with a clear conflict error.
5. **Given** an active refresh token, **When** the user requests a new access token, **Then** a fresh access token is issued and the old refresh token is rotated (invalidated).
6. **Given** a logged-in user, **When** they log out, **Then** their refresh token is invalidated and cannot be used again.

---

### User Story 2 - Frontend-Backend Communication (Priority: P1)

A web frontend application served from a specific origin can make requests to the backend API without being blocked by browser cross-origin security policies.

**Why this priority**: Without proper cross-origin configuration, the frontend cannot communicate with the backend at all, making the entire API inaccessible from the browser. This must work before any frontend integration can begin.

**Independent Test**: Can be fully tested by making requests from the configured allowed origin and verifying that preflight and actual requests succeed, while requests from disallowed origins are blocked.

**Acceptance Scenarios**:

1. **Given** a browser request from the configured frontend origin, **When** a preflight OPTIONS request is made, **Then** the backend responds with appropriate headers permitting the request.
2. **Given** a browser request from the configured frontend origin, **When** an authenticated API call is made, **Then** the response includes headers that allow the browser to process it.
3. **Given** a request from an origin not on the allowed list, **When** a preflight or direct request is made, **Then** the backend does not include permissive headers, causing the browser to block it.

---

### User Story 3 - Authenticated Block Management (Priority: P2)

A logged-in user can create, read, update, and delete their own blocks. Each block belongs exclusively to its creator, and no user can access or modify another user's blocks.

**Why this priority**: Blocks are the primary content of the application. Once authentication works, users need the ability to manage their data through the API with proper ownership enforcement.

**Independent Test**: Can be fully tested by authenticating as a user, performing CRUD operations on blocks, and verifying ownership isolation by attempting to access another user's blocks.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a block with a title and content, **Then** the block is saved and returned with a unique identifier.
2. **Given** an authenticated user with existing blocks, **When** they request their block list, **Then** only their non-deleted blocks are returned, ordered by most recently created first.
3. **Given** an authenticated user, **When** they request a specific block by ID that belongs to them, **Then** the full block data is returned.
4. **Given** an authenticated user, **When** they request a block ID that belongs to a different user, **Then** they receive a not-found error (ownership is not revealed).
5. **Given** an authenticated user, **When** they update fields of their own block, **Then** the updated block data is returned with only the specified fields changed.
6. **Given** an authenticated user, **When** they delete their own block, **Then** the block is soft-deleted and no longer appears in their block list.
7. **Given** an unauthenticated request, **When** any block endpoint is called, **Then** the system rejects it with an authentication error.

---

### User Story 4 - Interactive API Documentation (Priority: P2)

A developer or technical stakeholder can browse all available API endpoints through an interactive documentation interface. They can view expected request formats, response schemas, and execute test requests without writing custom code.

**Why this priority**: Good documentation reduces integration time, enables QA testing without custom tools, and serves as a living contract between frontend and backend teams.

**Independent Test**: Can be fully tested by navigating to the documentation URL, verifying all endpoints are listed with their schemas, and successfully executing a test request from the interface.

**Acceptance Scenarios**:

1. **Given** a developer, **When** they visit the documentation URL, **Then** they see an interactive list of all API endpoints grouped by resource (auth, blocks).
2. **Given** the documentation page, **When** a developer reviews an endpoint, **Then** they can see required and optional request parameters, example request bodies, and all possible response schemas including error cases.
3. **Given** the documentation page, **When** a developer executes a test request using an authenticated session, **Then** they see the real response from the server.
4. **Given** a developer reviewing auth endpoints, **When** they log in via the documentation interface, **Then** they can use the received token for subsequent authenticated calls within the same interface.

---

### User Story 5 - Environment Configuration Safety (Priority: P2)

The application validates all required environment variables at startup. If any required variable is missing or malformed, the application refuses to start and produces a clear error message identifying the problem. A developer setting up the project for the first time has an example configuration file to reference.

**Why this priority**: Configuration errors cause silent runtime failures that are hard to debug. Failing fast with a clear message prevents data corruption, misconfigured connections, and insecure deployments with default or missing secrets.

**Independent Test**: Can be fully tested by starting the application with a missing required variable and verifying it exits with a descriptive error, then verifying successful startup with all required variables present.

**Acceptance Scenarios**:

1. **Given** a required environment variable is missing, **When** the application starts, **Then** it exits immediately with a message clearly naming the missing variable.
2. **Given** a required environment variable is present but has an invalid format (e.g., a non-numeric port), **When** the application starts, **Then** it exits with a descriptive validation error.
3. **Given** all required environment variables are correctly set, **When** the application starts, **Then** it starts successfully.
4. **Given** a new developer setting up the project, **When** they reference the example environment file, **Then** they can identify all required variables, their expected formats, and safe placeholder values.

---

### Edge Cases

- What happens when a user submits a registration request with a password that is too short?
- What happens when an access token is expired and no valid refresh token exists?
- What happens when a refresh token is submitted more than once (token replay attack)?
- What happens when a block update request is submitted with an empty body (no fields to update)?
- What happens when a block is requested with a malformed identifier (not a valid UUID)?
- What happens when the database is unavailable during a request?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: The system MUST allow a new user to register with a unique email address and a password meeting minimum length requirements.
- **FR-002**: The system MUST issue a short-lived access token and a longer-lived refresh token upon successful login.
- **FR-003**: The system MUST validate the access token on every protected request and reject requests with missing, expired, or invalid tokens with a 401 response.
- **FR-004**: The system MUST allow a user to exchange a valid refresh token for a new access token; the used refresh token MUST be invalidated immediately upon exchange (rotation).
- **FR-005**: The system MUST allow a user to log out, invalidating their current refresh token.
- **FR-006**: The system MUST reject login attempts with incorrect credentials without revealing whether the email or the password was wrong.

**Block Management**

- **FR-007**: The system MUST allow an authenticated user to create a block with at minimum a title and content; type, visibility, and tags are optional fields with documented defaults.
- **FR-008**: The system MUST return only the requesting user's non-deleted blocks when listing blocks, ordered by creation date descending.
- **FR-009**: The system MUST allow retrieval of a single block by its unique identifier, returning a not-found error if the block does not belong to the requesting user or has been deleted.
- **FR-010**: The system MUST allow partial updates to a block's fields; fields not included in the request MUST retain their existing values.
- **FR-011**: The system MUST soft-delete blocks on delete requests, marking them as deleted without removing data, and excluding them from all subsequent user-facing queries.

**Cross-Origin Communication**

- **FR-012**: The system MUST allow browser requests from explicitly configured allowed origins; allowed origins MUST be configurable via an environment variable.
- **FR-013**: The system MUST respond correctly to browser preflight (OPTIONS) requests for all protected endpoints, including credentials and authorization headers.

**API Documentation**

- **FR-014**: Every API endpoint MUST be documented with its request schema, all response schemas (success and error), and authentication requirements.
- **FR-015**: The documentation interface MUST be accessible at a dedicated URL without authentication.
- **FR-016**: The documentation interface MUST allow developers to authenticate and execute live requests against the running server directly from the browser.

**Testing**

- **FR-017**: Each authentication endpoint MUST have automated tests covering the primary success path and all significant error paths (invalid input, conflict, wrong credentials, expired tokens).
- **FR-018**: Each block endpoint MUST have automated tests covering success paths, authentication failures, and ownership/not-found cases.
- **FR-019**: The test suite MUST run without a live database by using mocked or in-memory data layers.

**Environment Configuration**

- **FR-020**: The application MUST validate all required environment variables at startup and refuse to start with a descriptive error if any are missing or invalid.
- **FR-021**: The project MUST include an example environment file listing all required variables with their expected types, constraints, and safe placeholder values.
- **FR-022**: All application code MUST read configuration values from the validated configuration object rather than accessing environment variables directly.

### Key Entities

- **User**: An account holder. Attributes: unique identifier, email address (unique), hashed credential, optional display name, creation timestamp.
- **Block**: A unit of content owned by one user. Attributes: unique identifier, owner reference, title, content body, type (note/task/snippet/idea/link), lifecycle status (active/archived/deleted), visibility (private/public), tags (list of text labels), creation and last-updated timestamps.
- **Auth Session**: An active user session. Attributes: access token (short-lived bearer token carrying user identity), refresh token (longer-lived, stored securely server-side, invalidated on use).
- **Environment Config**: The validated startup configuration. Attributes: database connection details, token signing secret, access token expiry, refresh token expiry, allowed CORS origins, server port.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All authentication flows (register, login, token refresh, logout) complete successfully under normal conditions — 0 unhandled errors on valid inputs.
- **SC-002**: 100% of API endpoints (auth and block) are visible and interactable in the documentation interface.
- **SC-003**: 0% of unauthenticated requests to protected endpoints receive a successful response — all are rejected with an authentication error.
- **SC-004**: 100% of automated endpoint tests pass in a clean environment with no external database required.
- **SC-005**: The application refuses to start for 100% of missing or malformed required environment variables, each producing a descriptive error identifying the specific variable.
- **SC-006**: Requests from the configured frontend origin succeed; requests from non-configured origins are blocked by browser cross-origin policies.
- **SC-007**: A developer can discover, understand, and manually test any endpoint using only the documentation interface — no external tools or additional documentation required.

## Assumptions

- Access tokens use a 15-minute expiry by default; refresh tokens use 7 days. Both are configurable via environment variables.
- Password minimum length is 8 characters; no practical maximum beyond reasonable string limits.
- The allowed CORS origins environment variable accepts a comma-separated list to support multiple origins (e.g., local dev + staging).
- The documentation interface is accessible in all non-production environments; production visibility is configurable.
- Test suite uses mocked database clients; no live database connection is required to run tests.
- Token replay protection applies to refresh tokens: once used, a refresh token is immediately invalidated before the new token is issued.
- Block soft-delete retains the database record with a DELETED status; all user-facing queries filter out DELETED blocks.
- The stub user ID currently hardcoded in the block controller will be replaced by identity extracted from the validated access token.
