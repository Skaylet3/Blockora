# API Contracts: Todo API with Block Promotion

**Feature**: 006-todo-api
**Date**: 2026-03-05
**Base path**: `/todos`
**Auth**: All endpoints require `Authorization: Bearer <access_token>` (global JwtAuthGuard)
**Validation errors**: HTTP 422 (matches existing project convention)

---

## Enums

```
TodoPriority: HIGHEST | HIGH | MEDIUM | LOW | LOWEST
TodoStatus:   ACTIVE | COMPLETED
```

---

## TodoResponse (shared response shape)

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "string",
  "description": "string | null",
  "priority": "HIGHEST | HIGH | MEDIUM | LOW | LOWEST",
  "status": "ACTIVE | COMPLETED",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

---

## Endpoints

### GET /todos

List all todos owned by the authenticated user.

**Query parameters**:

| Parameter | Type   | Required | Values           | Description                             |
|-----------|--------|----------|------------------|-----------------------------------------|
| status    | string | No       | ACTIVE, COMPLETED | Filter by status. Omit to return all.  |

**Response 200**:
```json
[TodoResponse, ...]
```
Ordered by `createdAt` descending (newest first).

**Response 401**: Unauthorized

---

### GET /todos/:id

Get a single todo by UUID.

**Path parameters**: `id` — UUID of the todo

**Response 200**: `TodoResponse`

**Response 401**: Unauthorized

**Response 404**: Todo not found or belongs to another user

---

### POST /todos

Create a new todo.

**Request body**:
```json
{
  "title": "string (required, min 1 char)",
  "description": "string (optional)",
  "priority": "HIGHEST | HIGH | MEDIUM | LOW | LOWEST (optional, default: MEDIUM)"
}
```

**Response 201**: `TodoResponse` (status defaults to ACTIVE)

**Response 401**: Unauthorized

**Response 422**: Validation error (missing title, invalid priority)

---

### PATCH /todos/:id

Partially update an existing todo. All fields optional.

**Path parameters**: `id` — UUID of the todo

**Request body** (all fields optional):
```json
{
  "title": "string",
  "description": "string | null",
  "priority": "HIGHEST | HIGH | MEDIUM | LOW | LOWEST",
  "status": "ACTIVE | COMPLETED"
}
```

**Response 200**: `TodoResponse` with updated values

**Response 401**: Unauthorized

**Response 404**: Todo not found or belongs to another user

**Response 422**: Validation error (invalid priority or status value)

---

### DELETE /todos/:id

Permanently delete a todo.

**Path parameters**: `id` — UUID of the todo

**Response 200**: `TodoResponse` (the deleted record, for confirmation)

**Response 401**: Unauthorized

**Response 404**: Todo not found or belongs to another user

---

### POST /todos/from-block/:blockId

Promote a block of type `TASK` to a todo. Creates a new independent Todo record derived from the block's title. The block itself is not modified.

**Path parameters**: `blockId` — UUID of the block to promote

**Request body** (optional):
```json
{
  "priority": "HIGHEST | HIGH | MEDIUM | LOW | LOWEST (optional, default: MEDIUM)"
}
```

**Response 201**: `TodoResponse`
```json
{
  "id": "new-todo-uuid",
  "userId": "authenticated-user-uuid",
  "title": "<copied from block.title>",
  "description": null,
  "priority": "MEDIUM",
  "status": "ACTIVE",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Response 400**: Block exists but is not of type `TASK`

**Response 401**: Unauthorized

**Response 404**: Block not found or belongs to another user

**Response 422**: Validation error (invalid priority override)

---

## Error shape (existing convention)

All error responses follow the NestJS default format:
```json
{
  "statusCode": 404,
  "message": "Todo not found",
  "error": "Not Found"
}
```

Validation errors (422) include a `message` array:
```json
{
  "statusCode": 422,
  "message": ["title must be a string", "priority must be a valid enum value"],
  "error": "Unprocessable Entity"
}
```
