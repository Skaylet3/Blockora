# API Contracts: Todo Frontend Integration

**Feature**: 001-todo-frontend-integration
**Date**: 2026-03-05

These are the REST API calls the frontend will make to the existing backend todo API.
All requests include `Authorization: Bearer <accessToken>` header (handled by the shared `request()` client).

---

## todos.api.ts — New API Client

### GET /todos

Fetch all todos for the authenticated user, optionally filtered by status.

**Request**:
```
GET /todos
GET /todos?status=ACTIVE
GET /todos?status=COMPLETED
```

**Response** (200):
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Review project requirements",
    "description": "Go through all client requirements",
    "priority": "HIGH",
    "status": "ACTIVE",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z"
  }
]
```

**Frontend usage**: Called on page mount and on filter tab change.

---

### POST /todos

Create a new todo.

**Request**:
```json
{
  "title": "My new task",
  "description": "Optional description",
  "priority": "MEDIUM"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "My new task",
  "description": "Optional description",
  "priority": "MEDIUM",
  "status": "ACTIVE",
  "createdAt": "2026-03-05T10:00:00.000Z",
  "updatedAt": "2026-03-05T10:00:00.000Z"
}
```

**Frontend usage**: Called when user submits the create dialog (via FAB).

---

### PATCH /todos/:id

Update a todo's title, description, priority, or status.

**Request**:
```json
{
  "title": "Updated title",
  "status": "COMPLETED"
}
```

**Response** (200): Updated `TodoResponse` object.

**Frontend usage**:
- Toggle completion: `{ status: 'COMPLETED' }` or `{ status: 'ACTIVE' }`
- Save edit: `{ title, description }`
- Change priority: `{ priority: 'HIGH' }`

---

### DELETE /todos/:id

Permanently delete a todo.

**Response** (200): Deleted `TodoResponse` object.

**Frontend usage**: Called when user clicks delete in the todo card or detail modal.

---

## blocks.api.ts — Already Implemented (no changes needed)

### POST /todos/from-block/:blockId

Promote a TASK-type block to a todo.

```typescript
promoteToTodo(id: string, priority?: string): Promise<TodoResponse>
```

**Request body** (optional):
```json
{ "priority": "HIGH" }
```

**Response** (201): New `TodoResponse` object.

**Frontend usage**: Already wired in `BlocksClient` → `BlockCard`. No changes needed.

---

## UI Behavior Contracts

### Todo Page Load Sequence

1. Show loading skeleton
2. Fetch `GET /todos` (with status filter if applicable)
3. On success: render todo list
4. On error: render error state with "Retry" button

### Toggle Completion (Optimistic)

1. Immediately flip `status` in local state
2. Call `PATCH /todos/:id` with new status
3. On error: revert status in local state, show error toast

### Edit Todo (Save)

1. Call `PATCH /todos/:id` with `{ title, description }`
2. On success: update todo in local state, close edit form
3. On error: show error toast, keep edit form open

### Change Priority (Optimistic)

1. Immediately update `priority` in local state
2. Call `PATCH /todos/:id` with new priority
3. On error: revert priority, show error toast

### Delete Todo

1. Call `DELETE /todos/:id`
2. On success: remove todo from local state, close detail modal if open
3. On error: show error toast

### Create Todo (FAB)

1. Open dialog
2. User fills title (required), description (optional), priority (optional, default LOWEST)
3. Call `POST /todos`
4. On success: prepend new todo to local state, close dialog, show success toast
5. On error: show error toast, keep dialog open
