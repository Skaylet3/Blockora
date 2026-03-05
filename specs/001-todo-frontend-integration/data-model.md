# Data Model: Todo Frontend Integration

**Feature**: 001-todo-frontend-integration
**Date**: 2026-03-05

> No database changes. This document describes the **frontend TypeScript types** used in the todo integration.

---

## Frontend Types

### TodoPriority (string union)

```typescript
type TodoPriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST';
```

Maps to/from UI numeric priorities 1-5:
| UI Value | API Value |
|----------|-----------|
| 1        | HIGHEST   |
| 2        | HIGH      |
| 3        | MEDIUM    |
| 4        | LOW       |
| 5        | LOWEST    |

### TodoStatus (string union)

```typescript
type TodoStatus = 'ACTIVE' | 'COMPLETED';
```

Maps to/from UI `completed: boolean`:
| UI Value          | API Value |
|-------------------|-----------|
| `false` (active)  | ACTIVE    |
| `true` (done)     | COMPLETED |

### TodoResponse (API response shape)

```typescript
interface TodoResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}
```

### CreateTodoBody (POST /todos request)

```typescript
interface CreateTodoBody {
  title: string;
  description?: string;
  priority?: TodoPriority;
}
```

### UpdateTodoBody (PATCH /todos/:id request)

```typescript
interface UpdateTodoBody {
  title?: string;
  description?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
}
```

### PromoteBlockBody (POST /todos/from-block/:blockId request)

```typescript
interface PromoteBlockBody {
  priority?: TodoPriority;  // optional, defaults to LOWEST on backend
}
```

---

## Page-Level State Shape

The `todo-page.tsx` component will use `TodoResponse` directly (from API) rather than the current mock `Todo` interface. The page filter will be passed to the API instead of applied client-side for the status filter.

### FilterType

```typescript
type FilterType = 'All' | 'Active' | 'Completed';
```

Maps to API status param:
| FilterType  | API status param |
|-------------|-----------------|
| 'All'       | (not sent)       |
| 'Active'    | 'ACTIVE'        |
| 'Completed' | 'COMPLETED'     |

---

## Utility Helpers (defined in todos.api.ts)

```typescript
// Convert UI priority number to API enum
const UI_TO_PRIORITY: Record<number, TodoPriority> = {
  1: 'HIGHEST',
  2: 'HIGH',
  3: 'MEDIUM',
  4: 'LOW',
  5: 'LOWEST',
};

// Convert API enum to UI priority number
const PRIORITY_TO_UI: Record<TodoPriority, number> = {
  HIGHEST: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  LOWEST: 5,
};
```

> Note: These helpers are only needed if the page maintains numeric priorities internally. If the page adopts `TodoPriority` strings directly, these helpers are not needed. The recommended approach is to use `TodoPriority` strings throughout the page and only convert at display time (color, label).
