# Research: Todo Frontend Integration

**Feature**: 001-todo-frontend-integration
**Date**: 2026-03-05

---

## Decision 1: Priority Enum Mapping Strategy

**Decision**: Use a bidirectional constant map (`PRIORITY_TO_API` / `PRIORITY_FROM_API`) defined once in `todos.api.ts` and imported by the page.

**Rationale**: The UI uses numeric priorities 1-5 for color-coding and display; the backend uses named enums (`HIGHEST`, `HIGH`, `MEDIUM`, `LOW`, `LOWEST`). A single source of truth for the mapping prevents drift and keeps the page component clean.

**Mapping**:
```
1 (Highest) ↔ HIGHEST
2 (High)    ↔ HIGH
3 (Medium)  ↔ MEDIUM
4 (Low)     ↔ LOW
5 (Lowest)  ↔ LOWEST
```

**Alternatives considered**:
- Inline mapping in the component — rejected (scattered, harder to test)
- Using array index `['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'][n-1]` inline — rejected (not self-documenting, error-prone)

---

## Decision 2: Status Mapping Strategy

**Decision**: Map `completed: boolean` ↔ `status: 'ACTIVE' | 'COMPLETED'` at the API boundary in `todos.api.ts`. The page-level `Todo` interface will be updated to use `status: 'ACTIVE' | 'COMPLETED'` directly (aligned with the backend) and remove the `completed: boolean` field.

**Rationale**: Aligning the frontend type with the backend response eliminates a mapping layer and makes the data flow clearer. The UI already renders the `completed` flag only from `todo.completed`; changing to `todo.status === 'COMPLETED'` is a trivial update.

**Alternatives considered**:
- Keep `completed: boolean` in the UI and map from `status` at the API layer — rejected (extra conversion, diverges from backend contract)
- Use a separate `completedAt` timestamp — rejected (not in backend model, beyond MVP)

---

## Decision 3: State Management Approach

**Decision**: Local React `useState` with optimistic updates for all mutations (toggle, edit, delete, priority change). Pattern mirrors the existing `notes-page.tsx` and `blocks-client.tsx` implementations.

**Rationale**: The app uses local state throughout (no Redux, Zustand, or React Query). Introducing a new state manager for a single page would violate Principle III (Simplicity). Optimistic updates satisfy Principle IV (Performance is a Feature).

**Optimistic pattern**:
1. Update local state immediately
2. Fire API call
3. On success: no-op (or apply server-returned value to fix any drift)
4. On error: revert local state to pre-mutation value, show error toast

**Alternatives considered**:
- React Query / SWR for caching — rejected (not used elsewhere, adds a dependency, YAGNI)
- No optimistic updates (wait for server) — rejected (violates Principle IV, perceived slowness)

---

## Decision 4: Create Todo Dialog Pattern

**Decision**: Reuse the existing `Dialog` + `Input` + `Textarea` + `Select` shared UI components for the create todo form (triggered by FAB click). No new UI components needed.

**Rationale**: All required UI primitives already exist in `apps/web/src/shared/ui/`. Creating a dedicated `CreateTodoDialog` in the page file keeps everything self-contained and avoids premature component extraction per Principle III.

**Form fields**:
- Title (required, `Input`)
- Description (optional, `Textarea`)
- Priority (optional, `Select`, defaults to LOWEST to match backend default)

**Alternatives considered**:
- Inline form in the page body — rejected (disruptive to the todo list layout)
- Separate `features/create-todo/` feature module — rejected (premature abstraction for MVP)

---

## Decision 5: Filter-to-API Query Mapping

**Decision**: Pass `status` query param to `GET /todos?status=ACTIVE|COMPLETED` when a filter other than "All" is selected. For "All", no status param is sent (backend returns all todos).

**Rationale**: Server-side filtering reduces payload size when the user has many todos. The backend already supports the `status` query param.

**Filter tab mapping**:
```
"All"       → GET /todos           (no status param)
"Active"    → GET /todos?status=ACTIVE
"Completed" → GET /todos?status=COMPLETED
```

**Alternatives considered**:
- Fetch all, filter client-side — rejected (wasteful for users with many todos; backend supports filtering)
- Separate fetch per tab switch — chosen (fetch on filter change; cache last results)

---

## Decision 6: Tests

**Decision**: Write Vitest unit tests for `todos.api.ts` (mock `request()`) covering all 5 CRUD operations plus the priority/status mapping helpers. No component tests for `todo-page.tsx` in this iteration (the page is heavily stateful UI; integration testing would require mocking the API layer).

**Rationale**: Constitution Principle V requires tests. The API client is pure logic (no DOM) and easy to unit test. Component-level tests for the full page are valuable but out of scope for MVP per Principle III.

**Alternatives considered**:
- Full component tests with React Testing Library — deferred (valuable but not blocking MVP)
- No tests — rejected (violates Principle V)
