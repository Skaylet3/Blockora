# API Contracts: Notes & Storage API

**Feature**: 004-notes-storage-api | **Date**: 2026-03-04
**Base URL**: `/` (all routes require `Authorization: Bearer <access_token>` unless noted)

---

## Storages

### POST /storages — Create a Storage

**Request Body**:
```json
{
  "name": "Work",        // required, non-empty string
  "parentId": "uuid"     // optional; null or absent = root-level storage
}
```

**Success Response** `201 Created`:
```json
{
  "id": "uuid",
  "name": "Work",
  "parentId": null,
  "createdAt": "2026-03-04T10:00:00.000Z",
  "updatedAt": "2026-03-04T10:00:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized` — missing or invalid access token
- `404 Not Found` — `parentId` does not exist or belongs to another user
- `422 Unprocessable Entity` — `name` is missing or empty

---

### GET /storages — List All Storages (flat)

**Query Parameters**: none

**Success Response** `200 OK`:
```json
[
  {
    "id": "uuid-1",
    "name": "Work",
    "parentId": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "uuid-2",
    "name": "Projects",
    "parentId": "uuid-1",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Error Responses**:
- `401 Unauthorized`

---

### DELETE /storages/:id — Delete a Storage (cascade)

**Path Parameters**: `id` — UUID of the storage to delete

**Success Response** `204 No Content` (empty body)

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — storage does not exist or belongs to another user

---

## Notes

### POST /notes — Create a Note

**Request Body**:
```json
{
  "title": "My Note",       // required, non-empty string
  "content": "Some text",   // optional; defaults to ""
  "storageId": "uuid"       // required; must be a storage owned by the authenticated user
}
```

**Success Response** `201 Created`:
```json
{
  "id": "uuid",
  "title": "My Note",
  "content": "Some text",
  "storageId": "uuid",
  "createdAt": "2026-03-04T10:00:00.000Z",
  "updatedAt": "2026-03-04T10:00:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — `storageId` does not exist or belongs to another user
- `422 Unprocessable Entity` — `title` is missing/empty, or `storageId` is missing

---

### GET /notes — List Notes

**Query Parameters**:
- `storageId` (optional) — filter notes by storage; if omitted, returns all notes for the user

**Success Response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "title": "My Note",
    "content": "Some text",
    "storageId": "uuid",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — `storageId` query param provided but does not exist or belongs to another user

---

### GET /notes/:id — Get a Note

**Path Parameters**: `id` — UUID of the note

**Success Response** `200 OK`:
```json
{
  "id": "uuid",
  "title": "My Note",
  "content": "Some text",
  "storageId": "uuid",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — note does not exist or belongs to another user

---

### PATCH /notes/:id — Update a Note

**Path Parameters**: `id` — UUID of the note

**Request Body** (all fields optional; at least one expected):
```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

**Success Response** `200 OK`:
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": "Updated content",
  "storageId": "uuid",
  "createdAt": "...",
  "updatedAt": "2026-03-04T10:05:00.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — note does not exist or belongs to another user
- `422 Unprocessable Entity` — `title` provided but empty

---

### DELETE /notes/:id — Delete a Note

**Path Parameters**: `id` — UUID of the note

**Success Response** `204 No Content` (empty body)

**Error Responses**:
- `401 Unauthorized`
- `404 Not Found` — note does not exist or belongs to another user

---

## Authorization Contract

All endpoints require a valid JWT access token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

The global JWT guard (registered as `APP_GUARD`) enforces this on all routes. There are no `@Public()` routes in this feature.

Ownership is enforced at the service layer — all queries include a `userId` filter derived from the JWT payload. Any attempt to access another user's resources returns `404 Not Found` (not 403, to avoid confirming resource existence).

---

## Validation Contract

All input DTOs are validated by the global `ValidationPipe` (whitelist, transform enabled). Invalid inputs return `422 Unprocessable Entity` with a body listing the validation errors (matching the existing project convention).
