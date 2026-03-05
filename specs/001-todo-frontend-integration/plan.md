# Implementation Plan: Todo Frontend Integration

**Branch**: `001-todo-frontend-integration` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todo-frontend-integration/spec.md`

## Summary

Replace all mock data in the Todo page with real API calls to the backend todo endpoints (`006-todo-api`), implement the FAB create flow, and verify the existing block-to-todo promotion works end-to-end. The only new file needed is `todos.api.ts`; the main work is rewriting `todo-page.tsx`.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16.1.6, React 19, Tailwind CSS v4, Sonner (toasts), Lucide React, Radix UI primitives (Dialog, Select), native `fetch` via shared `request()` client
**Storage**: No frontend storage; all data lives in PostgreSQL via backend REST API
**Testing**: Vitest 3 + @testing-library/react 16 (component tests deferred; API client unit tests required)
**Target Platform**: Web browser (Next.js 16 client components)
**Project Type**: Frontend integration (Next.js pages + API client)
**Performance Goals**: Optimistic UI updates — mutations feel instant; initial load <500ms perceived
**Constraints**: TypeScript strict mode; no business logic in `apps/web`; no new dependencies
**Scale/Scope**: Single user's personal todo list (tens to hundreds of todos)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Blocks Are Atomic | PASS | Block model unchanged; promote button is the only cross-domain bridge |
| II. Privacy by Default | PASS | All API calls include bearer token; backend scopes data to authenticated user |
| III. Simplicity Over Features | PASS | No new features beyond the defined Tasks MVP; no new dependencies |
| IV. Performance is a Feature | PASS | Optimistic updates for toggle/priority/delete; loading skeletons on initial load |
| V. Type-Safe and Test-Driven | PASS | Strict TypeScript throughout; Vitest unit tests for todos.api.ts |
| VI. Monorepo Discipline | PASS | All changes in apps/web; no business logic; UI only |
| VIII. Tasks System | PASS | Implementing the dedicated Tasks page integration as required by constitution |

**No violations. Gate passed.**

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-frontend-integration/
├── plan.md              # This file
├── research.md          # Technical decisions
├── data-model.md        # Frontend TypeScript types
├── quickstart.md        # Manual integration scenarios
├── contracts/
│   └── api-contracts.md # API call specs and UI behavior contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
apps/web/src/
├── shared/
│   └── api/
│       ├── todos.api.ts                    # NEW: Todo CRUD client
│       └── __tests__/
│           └── todos.api.test.ts           # NEW: Unit tests
└── pages-flat/
    └── todo/
        └── ui/
            └── todo-page.tsx               # MODIFY: Replace mock data with real API
```

**No other files change.** `blocks.api.ts` already has `promoteToTodo()`. `block-card.tsx` and `blocks-client.tsx` already wire up the promote button.

**Structure Decision**: Single `apps/web` frontend app (no backend changes needed for this feature).

## Implementation Details

### 1. todos.api.ts (New File)

Exports types and the `todosApi` object:
- `getTodos(status?: TodoStatus): Promise<TodoResponse[]>` — GET /todos?status=...
- `getTodo(id: string): Promise<TodoResponse>` — GET /todos/:id
- `createTodo(body: CreateTodoBody): Promise<TodoResponse>` — POST /todos
- `updateTodo(id: string, body: UpdateTodoBody): Promise<TodoResponse>` — PATCH /todos/:id
- `deleteTodo(id: string): Promise<TodoResponse>` — DELETE /todos/:id

Also exports priority mapping helpers:
- `PRIORITY_TO_UI: Record<TodoPriority, 1|2|3|4|5>`
- `UI_TO_PRIORITY: Record<1|2|3|4|5, TodoPriority>`

### 2. todo-page.tsx Changes

**Remove**: MOCK_TODOS, Todo interface, all mock-only state updates.

**Add**:
- useEffect to load todos on mount; re-fetch on filter change
- Loading skeleton and error state with Retry button
- Create dialog (opened by FAB): Title (required), Description (optional), Priority (optional, default LOWEST)
- Optimistic update pattern for all mutations
- Sonner toast for all server operations

**Update**:
- Use TodoResponse from todos.api.ts as the todo type
- Use TodoPriority strings for priority; map to 1-5 only for color display using PRIORITY_TO_UI
- Use status: 'ACTIVE' | 'COMPLETED' for completion; check status === 'COMPLETED'
- Filter tabs map to API status query param

### 3. todos.api.test.ts (New File)

Vitest unit tests covering:
- Each method calls request() with correct path, method, body
- Status filter is passed as query param (?status=ACTIVE)
- Priority/UI mapping helpers are correct and bidirectional

## Complexity Tracking

No constitution violations. This table is intentionally empty.
