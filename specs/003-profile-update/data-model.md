# Data Model: User Profile Update

**Feature**: 003-profile-update
**Date**: 2026-03-02

## Existing Entities (unchanged)

### User (Prisma — `users` table)

No schema changes required. The `displayName` column already exists.

| Field        | Type      | Constraints                         |
|--------------|-----------|-------------------------------------|
| id           | UUID      | PK, auto-generated                  |
| email        | String    | Unique, required                    |
| passwordHash | String    | Required, not exposed via API       |
| displayName  | String?   | Optional, max 100 chars, trimmable  |
| createdAt    | DateTime  | Auto-managed                        |
| updatedAt    | DateTime  | Auto-managed on every update        |

**State transitions relevant to this feature**:
`displayName = null | ""` → trimmed, stored as `null` if empty after trim
`displayName = "some text"` → stored as trimmed string, max 100 chars

---

## New DTOs (backend)

### UpdateProfileDto

Used as the request body for `PATCH /users/me`.

| Field       | Type    | Validation                           | Behaviour when absent |
|-------------|---------|--------------------------------------|-----------------------|
| displayName | string? | Optional, max 100 chars, auto-trim   | Field not updated     |

- All fields are independently optional — the service applies only the fields that are present.
- Whitespace-only values are treated as empty (trimmed → `null` stored).
- Future profile fields (e.g., `bio`, `avatarUrl`) can be added to this DTO without breaking
  existing clients.

### ProfileResponseDto

Returned by both `GET /auth/me` and `PATCH /users/me`.

| Field       | Type    | Description                               |
|-------------|---------|-------------------------------------------|
| userId      | string  | User's UUID                               |
| email       | string  | User's email address (read-only)          |
| displayName | string? | User's display name, null if not set      |

---

## New DTOs (frontend)

### UpdateProfileBody (TypeScript interface in `auth.api.ts`)

Mirrors `UpdateProfileDto`.

| Field       | Type    | Required |
|-------------|---------|----------|
| displayName | string? | No       |

### User (updated interface in `auth.api.ts`)

The existing `User` interface gains `displayName`.

| Field       | Type    | Notes                          |
|-------------|---------|--------------------------------|
| userId      | string  | Unchanged                      |
| email       | string  | Unchanged                      |
| displayName | string? | New — null/undefined if not set |

---

## Validation Rules

| Rule              | Constraint                             | Error response            |
|-------------------|----------------------------------------|---------------------------|
| Max length        | `displayName` ≤ 100 characters         | HTTP 422, validation error |
| Whitespace trim   | Leading/trailing whitespace removed    | Applied silently           |
| Whitespace-only   | Treated as empty → stored as null      | Accepted, no error        |
| Optional field    | Absent `displayName` → field unchanged | Accepted, no error        |
| Authentication    | Request must carry valid access token  | HTTP 401                  |
