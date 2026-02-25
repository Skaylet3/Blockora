# API Endpoint Contracts

**Feature**: `001-api-auth-swagger`
**Base URL**: `http://localhost:{PORT}` (configurable via `PORT` env var)
**Auth**: Bearer JWT in `Authorization: Bearer <accessToken>` header (unless marked `[PUBLIC]`)
**Content-Type**: `application/json` for all request/response bodies

---

## Auth Endpoints (`/auth`)

### POST /auth/register `[PUBLIC]`

Register a new user account.

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "displayName": "Optional Name"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | `{ "accessToken": "...", "refreshToken": "..." }` | Registration successful |
| 409 | `{ "statusCode": 409, "message": "Email already registered" }` | Email already in use |
| 422 | `{ "statusCode": 422, "message": ["email must be an email", ...] }` | Validation error |

---

### POST /auth/login `[PUBLIC]`

Authenticate with existing credentials.

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "accessToken": "...", "refreshToken": "..." }` | Login successful |
| 401 | `{ "statusCode": 401, "message": "Invalid credentials" }` | Wrong email or password |
| 422 | `{ "statusCode": 422, "message": [...] }` | Validation error |

---

### POST /auth/refresh `[PUBLIC]`

Exchange a valid refresh token for a new access token. Old refresh token is invalidated.

**Request body**:
```json
{
  "refreshToken": "<opaque-refresh-token-string>"
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "accessToken": "...", "refreshToken": "..." }` | Token refreshed successfully |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Token invalid, expired, or already used |

---

### POST /auth/logout `[PROTECTED]`

Invalidate all active refresh tokens for the current user.

**Request headers**: `Authorization: Bearer <accessToken>`

**Request body**: none

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 204 | (empty) | Logged out successfully |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid access token |

---

### GET /auth/me `[PROTECTED]`

Return the identity of the currently authenticated user.

**Request headers**: `Authorization: Bearer <accessToken>`

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `{ "userId": "uuid", "email": "user@example.com" }` | Token valid |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid access token |

---

## Block Endpoints (`/blocks`)

All block endpoints require `Authorization: Bearer <accessToken>`. All responses are scoped to the authenticated user — blocks belonging to other users are invisible (returned as 404, not 403).

---

### GET /blocks `[PROTECTED]`

List all non-deleted blocks for the authenticated user.

**Query parameters**: none (pagination to be added in a future feature)

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | `Block[]` (array, ordered by `createdAt` descending) | Success |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid token |

**Block object shape**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "My Block",
  "content": "Block body text",
  "type": "NOTE",
  "status": "ACTIVE",
  "visibility": "PRIVATE",
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-02-25T00:00:00.000Z",
  "updatedAt": "2026-02-25T00:00:00.000Z",
  "archivedAt": null
}
```

---

### GET /blocks/:id `[PROTECTED]`

Get a single block by its UUID.

**Path parameters**: `id` — UUID of the block

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Block object (see above) | Block exists and belongs to user |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid token |
| 404 | `{ "statusCode": 404, "message": "Block not found" }` | Block not found, deleted, or belongs to another user |

---

### POST /blocks `[PROTECTED]`

Create a new block.

**Request body**:
```json
{
  "title": "My Block Title",
  "content": "Block content goes here",
  "type": "NOTE",
  "visibility": "PRIVATE",
  "tags": ["research", "todo"]
}
```

Fields `type`, `visibility`, and `tags` are optional. Defaults: `type=NOTE`, `visibility=PRIVATE`, `tags=[]`.

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 201 | Block object | Block created successfully |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid token |
| 422 | `{ "statusCode": 422, "message": [...] }` | Validation error (e.g., missing title) |

---

### PATCH /blocks/:id `[PROTECTED]`

Partially update a block. Only fields present in the body are updated.

**Path parameters**: `id` — UUID of the block

**Request body** (all fields optional):
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "type": "TASK",
  "visibility": "PUBLIC",
  "tags": ["updated"]
}
```

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Block object (updated) | Block updated successfully |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid token |
| 404 | `{ "statusCode": 404, "message": "Block not found" }` | Block not found, deleted, or belongs to another user |
| 422 | `{ "statusCode": 422, "message": [...] }` | Validation error |

---

### DELETE /blocks/:id `[PROTECTED]`

Soft-delete a block. The block is marked with `status: DELETED` and excluded from all future queries. Data is not permanently removed.

**Path parameters**: `id` — UUID of the block

**Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| 200 | Block object (with `status: "DELETED"`) | Block soft-deleted |
| 401 | `{ "statusCode": 401, "message": "Unauthorized" }` | Missing or invalid token |
| 404 | `{ "statusCode": 404, "message": "Block not found" }` | Block not found or belongs to another user |

---

## CORS Behaviour

- Allowed origins: configured via `CORS_ORIGINS` env var (comma-separated list)
- Allowed methods: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
- Allowed headers: `Authorization`, `Content-Type`
- Credentials: allowed (required for cookies/auth headers from browser)
- Preflight: responds with 204 + CORS headers for all OPTIONS requests

---

## Error Response Shape (Consistent)

All error responses follow NestJS's default exception format:

```json
{
  "statusCode": 404,
  "message": "Block not found",
  "error": "Not Found"
}
```

Validation errors (422) use an array for `message`:
```json
{
  "statusCode": 422,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Unprocessable Entity"
}
```

---

## Swagger / API Docs

| Path | Description |
|------|-------------|
| `/api/docs` | Interactive Swagger UI — browse and test all endpoints |
| `/api/docs-json` | Raw OpenAPI JSON document |

Authentication in Swagger UI: Click the **Authorize** button, paste the `accessToken` from `POST /auth/login`, then use "Execute" on any protected endpoint.
