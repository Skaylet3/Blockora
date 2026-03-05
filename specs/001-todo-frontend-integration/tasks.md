# Tasks: Todo Frontend Integration

**Input**: Design documents from `/specs/001-todo-frontend-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Verify project wiring before starting feature work

- [X] T001 Confirm the existing `apps/web/src/shared/api/blocks.api.ts` already has `promoteToTodo()` wired to `POST /todos/from-block/:id` (read-only verification — no changes needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared `todos.api.ts` API client that ALL user stories depend on

**CRITICAL**: US1 and US2 cannot start until this phase is complete

- [X] T002 Create `apps/web/src/shared/api/todos.api.ts` with exported types: `TodoPriority` (union of HIGHEST|HIGH|MEDIUM|LOW|LOWEST), `TodoStatus` (ACTIVE|COMPLETED), `TodoResponse` interface, `CreateTodoBody` interface, `UpdateTodoBody` interface
- [X] T003 Add `PRIORITY_TO_UI` and `UI_TO_PRIORITY` mapping helpers to `apps/web/src/shared/api/todos.api.ts` (bidirectional: TodoPriority ↔ 1|2|3|4|5)
- [X] T004 Add `todosApi` object to `apps/web/src/shared/api/todos.api.ts` with methods: `getTodos(status?: TodoStatus)` → GET /todos?status=..., `getTodo(id)` → GET /todos/:id, `createTodo(body)` → POST /todos, `updateTodo(id, body)` → PATCH /todos/:id, `deleteTodo(id)` → DELETE /todos/:id

**Checkpoint**: `todos.api.ts` is complete and TypeScript compiles without errors

---

## Phase 3: User Story 1 - Todo Page Real Data Integration (Priority: P1) MVP

**Goal**: Replace all hardcoded mock data in the todo page with live server data. All CRUD operations (toggle, edit, delete, priority change) persist to the backend.

**Independent Test**: Open `/todo`, see real todos (or empty state). Toggle a todo complete, refresh — still completed. Edit a title, refresh — still updated.

### Implementation for User Story 1

- [X] T005 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: replace the `Todo` interface and `MOCK_TODOS` constant with imports from `apps/web/src/shared/api/todos.api.ts` (`TodoResponse`, `TodoPriority`, `PRIORITY_TO_UI`); remove the local `Todo` type entirely
- [X] T006 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: replace `useState<Todo[]>(MOCK_TODOS)` with `useState<TodoResponse[]>([])`, add `loading: boolean` and `error: string | null` state; add `useEffect` that calls `todosApi.getTodos()` on mount and sets todos, loading, and error state
- [X] T007 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: add loading skeleton UI (3 placeholder divs with `animate-pulse`) shown when `loading === true`, and an error state with a "Retry" button that re-calls `todosApi.getTodos()` shown when `error !== null`
- [X] T008 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: update `filteredTodos` to filter on `todo.status === 'ACTIVE'` / `todo.status === 'COMPLETED'` instead of `todo.completed`; update `toggleTodo` to call `todosApi.updateTodo(id, { status: current === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE' })` with optimistic update (flip status in local state immediately, revert + `toast.error` on failure)
- [X] T009 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: update `saveEdit` to call `todosApi.updateTodo(idToSave, { title: editTitle, description: editDescription })` and update the todo in local state on success; show `toast.error` on failure; keep edit form open on failure
- [X] T010 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: update `deleteTodo` to call `todosApi.deleteTodo(id)` and remove from local state on success; show `toast.error` on failure; add `toast.success` on successful delete
- [X] T011 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: add priority change handler that calls `todosApi.updateTodo(id, { priority: newPriority })` with optimistic update; wire to the Select `onChange` in the detail modal; update all priority color comparisons from `todo.priority === 1` to `PRIORITY_TO_UI[todo.priority] === 1` (or use the `TodoPriority` string directly, e.g., `todo.priority === 'HIGHEST'`)
- [X] T012 [US1] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: add `import { toast } from 'sonner'` and add `toast.success` calls for successful toggle, edit save, and delete operations; ensure all error paths show `toast.error`

**Checkpoint**: The todo page loads real data, all mutations persist after page refresh, all operations show success/error toasts

---

## Phase 4: User Story 2 - Create Todo via FAB (Priority: P2)

**Goal**: The floating action button opens a create dialog where users can enter a title, optional description, and optional priority to create a new todo.

**Independent Test**: Click the FAB → dialog opens. Enter "Test task", click Save → dialog closes, todo appears in list. Refresh → todo still there.

### Implementation for User Story 2

- [X] T013 [US2] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: add `createOpen: boolean`, `createTitle: string`, `createDescription: string`, `createPriority: TodoPriority` state variables; wire FAB `onClick={() => {}}` to `onClick={() => setCreateOpen(true)}`
- [X] T014 [US2] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: implement `handleCreate` async function that calls `todosApi.createTodo({ title: createTitle.trim(), description: createDescription.trim() || undefined, priority: createPriority })`, prepends the returned `TodoResponse` to the todos state, resets form fields, closes dialog, and shows `toast.success`; on error shows `toast.error` and keeps dialog open
- [X] T015 [US2] In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: add a `Dialog` (from `@/shared/ui/dialog`) for create-todo, opened when `createOpen === true`, containing: `Input` for title (required), `Textarea` for description (optional), `Select` for priority (options: HIGHEST/HIGH/MEDIUM/LOW/LOWEST, default LOWEST), Cancel button that resets and closes, Save button (disabled when title is empty or saving) that calls `handleCreate`

**Checkpoint**: FAB opens dialog, form validates (empty title = no submit), successful create prepends todo to list and persists after refresh

---

## Phase 5: User Story 3 - Block Promotion End-to-End (Priority: P3)

**Goal**: Verify and confirm the existing promote flow works end-to-end. The button, API call, and toasts are already implemented — this phase confirms correct wiring.

**Independent Test**: On `/blocks`, click the ListTodo button on a TASK-type block → "Added to todo list" toast → navigate to `/todo` → block title appears as a new todo.

### Implementation for User Story 3

- [X] T016 [P] [US3] Verify `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx` line 247-258: confirm `onPromote` is only passed for `block.type === 'TASK'`, calls `blocksApi.promoteToTodo(block.id)`, shows `toast.success('Added to todo list')` on success and `toast.error('Failed to add to todo list')` on failure — no code changes expected, this is a read-verify task
- [X] T017 [P] [US3] Verify `apps/web/src/entities/block/ui/block-card.tsx`: confirm the `ListTodo` button renders only when `block.type === 'TASK' && onPromote` and calls `onPromote()` on click — no code changes expected

**Checkpoint**: Block promotion verified end-to-end; clicking the button on a TASK block creates a todo visible on the `/todo` page

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Unit tests for the new API client and filter re-fetch behavior

- [X] T018 [P] Create `apps/web/src/shared/api/__tests__/todos.api.test.ts` with Vitest unit tests that mock `request()` from `http-client.ts` and assert: `getTodos()` calls `request('/todos')`, `getTodos('ACTIVE')` calls `request('/todos?status=ACTIVE')`, `createTodo(body)` calls `request('/todos', { method: 'POST', body })`, `updateTodo(id, body)` calls `request(\`/todos/${id}\`, { method: 'PATCH', body })`, `deleteTodo(id)` calls `request(\`/todos/${id}\`, { method: 'DELETE' })`
- [X] T019 [P] Add mapping validation assertions to `apps/web/src/shared/api/__tests__/todos.api.test.ts`: assert `PRIORITY_TO_UI` maps all 5 TodoPriority values to 1-5, `UI_TO_PRIORITY` maps all 5 numbers to the correct enum strings, and the two maps are inverses of each other
- [X] T020 In `apps/web/src/pages-flat/todo/ui/todo-page.tsx`: update the filter tab `onClick` handlers to re-fetch todos from the server with the appropriate status param when the filter changes (e.g., clicking "Active" calls `todosApi.getTodos('ACTIVE')`) rather than just filtering local state — this applies server-side filtering as specified in research.md Decision 5

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks US1 and US2
- **Phase 3 (US1)**: Depends on Phase 2 (needs `todos.api.ts` types and client)
- **Phase 4 (US2)**: Depends on Phase 2 (needs `todosApi.createTodo`) and can start independently of US1
- **Phase 5 (US3)**: No dependencies — can run in parallel with any phase (read-only verification)
- **Phase 6 (Polish)**: T018/T019 depend on Phase 2; T020 can be done anytime after T006

### User Story Dependencies

- **US1 (P1)**: Depends on foundational `todos.api.ts`
- **US2 (P2)**: Depends on foundational `todos.api.ts`; independent of US1 (creates its own dialog state)
- **US3 (P3)**: Independent of everything — read-only verification of existing code

### Within Each User Story

- US1: T005 → T006 → T007 (can parallel) | T008, T009, T010, T011 (can parallel after T006) → T012
- US2: T013 → T014 → T015 (sequential, same file)
- US3: T016 and T017 fully parallel

---

## Parallel Opportunities

```text
# Phase 2 can proceed immediately after Phase 1:
Task T002: Add types to todos.api.ts
Task T003: Add mapping helpers to todos.api.ts
Task T004: Add todosApi object methods to todos.api.ts
(T002 → T003 → T004 sequential in same file)

# Once Phase 2 is done, these can start in parallel:
Task T005-T012 (US1 implementation in todo-page.tsx)
Task T016-T017 (US3 verification, fully independent)

# Within US1, after T006 (useState + useEffect setup):
Task T008: toggleTodo with optimistic update
Task T009: saveEdit with API call
Task T010: deleteTodo with API call
Task T011: priority change handler
(all touch the same file — implement sequentially per handler)

# Phase 6 parallel opportunities:
Task T018: todos.api.ts test file (independent of todo-page work)
Task T019: mapping validation tests (alongside T018)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Create `todos.api.ts`
3. Complete Phase 3: Wire todo-page to real API
4. **STOP and VALIDATE**: Open `/todo`, verify data loads from server, all CRUD operations persist
5. US1 delivers full value independently

### Incremental Delivery

1. Phase 1 + 2 → `todos.api.ts` ready
2. Phase 3 (US1) → Live todo list with full CRUD (**MVP**)
3. Phase 4 (US2) → Add create-via-FAB flow
4. Phase 5 (US3) → Verify block promotion end-to-end
5. Phase 6 → Unit tests + server-side filter re-fetch

### Parallel Team Strategy

With two developers:
- Developer A: Phase 2 → Phase 3 (todos.api.ts + todo-page rewrite)
- Developer B: Phase 5 immediately (US3 verification, no dependencies)
- After Phase 2: Developer B can start Phase 4 (US2 create dialog)

---

## Notes

- T001, T016, T017 are read-only verification tasks (no code to write if already implemented correctly)
- The `todo-page.tsx` tasks (T005-T015, T020) all modify the same file — implement sequentially
- Sonner toast import must be added (T012) if not already present in `todo-page.tsx`
- The existing `Dialog`, `Input`, `Textarea`, `Select` components in `@/shared/ui` are ready to use — no new UI components needed
- `blocks.api.ts` `promoteToTodo()` returns `any` — consider tightening to `TodoResponse` in Phase 6 polish (optional)
