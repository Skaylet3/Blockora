# API Contracts: User Profile Update

**Feature**: 003-profile-update
**Date**: 2026-03-02
**Base URL**: `/api` (all paths below are relative)

---

## Updated: GET /auth/me

Returns the authenticated user's full profile including `displayName`.

**Change from current**: Adds `displayName` field. Previously returned only `userId` and `email`.

### Request

```
GET /auth/me
Authorization: Bearer <access_token>
```

### Response — 200 OK

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

`displayName` is `null` if the user has not set one.

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": null
}
```

### Response — 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## New: PATCH /users/me

Partially updates the authenticated user's profile. Only provided fields are modified.

### Request

```
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "displayName": "Alice"
}
```

All fields are optional. Sending an empty object `{}` is valid and results in no changes.
Sending `"displayName": ""` or `"displayName": "   "` clears the display name (stored as null).

### Response — 200 OK

Returns the full updated profile.

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Alice"
}
```

### Response — 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Response — 422 Unprocessable Entity (validation failure)

```json
{
  "statusCode": 422,
  "message": ["displayName must be shorter than or equal to 100 characters"],
  "error": "Unprocessable Entity"
}
```

---

## Validation Constraints

| Field       | Rule            | HTTP Status |
|-------------|-----------------|-------------|
| displayName | max 100 chars   | 422         |
| displayName | optional        | —           |
| displayName | string          | 422         |

---

## Frontend API Method (TypeScript)

Added to `apps/web/src/shared/api/auth.api.ts`:

```typescript
interface UpdateProfileBody {
  displayName?: string;
}

// In authApi object:
updateProfile(body: UpdateProfileBody): Promise<User>
// → PATCH /users/me
// Returns updated User (with displayName included)
```

The `User` interface is extended:

```typescript
interface User {
  userId: string;
  email: string;
  displayName?: string;  // added
}
```
