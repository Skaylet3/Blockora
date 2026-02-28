# API Contracts: Frontend–Backend Integration

**Feature**: 001-frontend-api-integration
**Phase**: 1 — Contracts
**Date**: 2026-02-28

Base URL: `https://blockora-api.vercel.app/api`

All authenticated endpoints require: `Authorization: Bearer <accessToken>`

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "Str0ngP@ss!",
  "displayName": "Alice"   // optional
}
```

**Response 201**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>"
}
```

**Response 409** — Email already registered
**Response 422** — Validation error (email format, password < 8 chars)

---

### POST /auth/login

Authenticate with existing credentials.

**Request**
```json
{
  "email": "user@example.com",
  "password": "Str0ngP@ss!"
}
```

**Response 200**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>"
}
```

**Response 401** — Invalid credentials
**Response 422** — Validation error

---

### POST /auth/refresh

Exchange a refresh token for a new token pair (rotation).

**Request**
```json
{
  "refreshToken": "<refresh-token>"
}
```

**Response 200**
```json
{
  "accessToken": "<new-jwt>",
  "refreshToken": "<new-refresh-token>"
}
```

**Response 401** — Refresh token invalid, expired, or revoked

---

### POST /auth/logout *(requires auth)*

Revoke all active refresh tokens for the authenticated user.

**Request** — No body

**Response 204** — No content

---

### GET /auth/me *(requires auth)*

Return the authenticated user's identity.

**Response 200**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

---

## Block Endpoints *(all require auth)*

### GET /blocks

List all non-deleted blocks belonging to the authenticated user, ordered by `createdAt` descending.

**Response 200**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "My first note",
    "content": "Content goes here",
    "type": "NOTE",
    "status": "ACTIVE",
    "visibility": "PRIVATE",
    "tags": ["typescript", "nestjs"],
    "createdAt": "2026-02-28T00:00:00.000Z",
    "updatedAt": "2026-02-28T00:00:00.000Z",
    "archivedAt": null
  }
]
```

---

### GET /blocks/:id

Get a single block by UUID.

**Response 200** — Block object (same shape as above)
**Response 404** — Block not found or does not belong to the authenticated user

---

### POST /blocks

Create a new block.

**Request**
```json
{
  "title": "My note",
  "content": "Content here",
  "type": "NOTE",          // optional, defaults to NOTE
  "visibility": "PRIVATE", // optional, defaults to PRIVATE
  "tags": ["tag1", "tag2"] // optional
}
```

**Response 201** — Created block object
**Response 422** — Validation error (e.g., title empty)

---

### PATCH /blocks/:id

Partially update a block (any subset of fields).

**Request** — Any subset of:
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "type": "TASK",
  "visibility": "PUBLIC",
  "tags": ["updated-tag"],
  "status": "ARCHIVED"
}
```

**Response 200** — Updated block object
**Response 404** — Block not found or does not belong to the authenticated user
**Response 422** — Validation error

---

### DELETE /blocks/:id

Soft-delete a block (sets `status = DELETED`). The block no longer appears in `GET /blocks`.

**Response 200** — Deleted block object (with `status: "DELETED"`)
**Response 404** — Block not found or does not belong to the authenticated user

---

## Error Response Shape

All error responses follow the NestJS default error format:

**4xx Errors**
```json
{
  "statusCode": 422,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Unprocessable Entity"
}
```

**Note**: `message` may be a string (single error) or an array of strings (validation errors from class-validator). The frontend error handler must handle both shapes.

---

## Frontend HTTP Client Interface

```ts
// shared/api/http-client.ts
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;   // for /auth/register, /auth/login, /auth/refresh
}

// Returns parsed JSON on success; throws ApiError on failure
async function request<T>(path: string, options?: RequestOptions): Promise<T>

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

**Auth Header Injection**: The client reads `localStorage.getItem('blockora-access-token')` and attaches `Authorization: Bearer <token>` to every request where `skipAuth` is not `true`.

**Retry Logic**: On `401` response, client calls `POST /auth/refresh` (with `skipAuth: true`) using the stored refresh token. If successful, retries the original request once. If refresh fails, clears tokens and redirects to `/login`.
