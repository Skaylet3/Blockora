# Feature Specification: Todo Frontend Integration

**Feature Branch**: `001-todo-frontend-integration`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "look at the frontend todo page and the added button on block with 'task' type which adds it to the todo. Integrate the backend and the frontend. Look carefully"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Todo Page Real Data Integration (Priority: P1)

As a user, I want the Todo page to show my actual todos from the server, so that my tasks persist across sessions and devices. Currently the todo page shows hardcoded mock data and all actions (toggle complete, edit, delete, change priority) only update local state that disappears on page refresh.

**Why this priority**: Without real data, the todo page has no value to the user — everything is lost on refresh. This is the foundational integration.

**Independent Test**: Open the todo page, verify todos load from the server. Create a todo via the FAB (+) button, refresh the page, and confirm it still exists with correct data.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the todo page, **When** the page loads, **Then** their todos from the server are displayed with correct title, description, priority color, and completion status.
2. **Given** a user who has no todos, **When** the page loads, **Then** an empty state is shown.
3. **Given** a user viewing their todos, **When** they click the complete checkbox on a todo, **Then** the todo status is updated on the server and the UI reflects the change immediately (optimistic update).
4. **Given** a user viewing their todos, **When** they change a todo's priority via the detail modal, **Then** the priority is persisted on the server.
5. **Given** a user viewing their todos, **When** they edit a todo's title/description and save, **Then** the changes are persisted on the server.
6. **Given** a user viewing their todos, **When** they delete a todo, **Then** it is removed from the server and disappears from the list.
7. **Given** a user viewing their todos, **When** an API call fails, **Then** an error toast notification is shown and the UI reverts to its previous state.

---

### User Story 2 - Create Todo via FAB (Priority: P2)

As a user, I want to click the floating action button (+) on the todo page to create a new todo, so I can quickly add tasks without navigating away.

Currently the FAB's `onClick` is a no-op. It should open a creation form where the user can enter a title, optional description, and optional priority, then save to the server.

**Why this priority**: The create flow is needed to add todos from the todo page itself. Without it, the only way to create todos is via block promotion.

**Independent Test**: Click the FAB, fill in a title, submit, and verify the new todo appears in the list and persists after page refresh.

**Acceptance Scenarios**:

1. **Given** a user on the todo page, **When** they click the FAB, **Then** a creation form or dialog opens.
2. **Given** an open creation form, **When** the user enters a title and submits, **Then** the todo is created on the server and added to the list.
3. **Given** an open creation form, **When** the user submits with an empty title, **Then** the form does not submit.
4. **Given** an open creation form, **When** the user cancels, **Then** the form closes without creating anything.

---

### User Story 3 - Block Promotion End-to-End (Priority: P3)

As a user, I want to click the todo button on a TASK-type block card, so that block is promoted to a todo that appears in my todo list.

The button UI and API call are already wired. This story confirms the flow works end-to-end with proper user feedback.

**Why this priority**: The button and API wiring already exist; this story confirms it works and has proper feedback.

**Independent Test**: On the blocks page, click the promote button on a TASK block, see a success toast, navigate to the todo page and confirm the block's title appears as a todo.

**Acceptance Scenarios**:

1. **Given** a user on the blocks page with a TASK-type block, **When** they click the promote button, **Then** the block is promoted to a todo on the server and a success toast is shown.
2. **Given** a user who clicked promote, **When** they navigate to the todo page, **Then** the new todo appears with the block's title.
3. **Given** the server is unavailable when promote is clicked, **When** the call fails, **Then** an error toast is shown.

---

### Edge Cases

- What happens when the todo page loads and the network request fails? Show an error state with a retry option.
- What happens when editing a todo with an empty title? Prevent saving and show validation feedback.
- What happens when the user is on the "Completed" filter tab and marks a todo active? It should disappear from the filtered view.
- What happens when a newly created todo doesn't match the current filter? Reset filter to "All" or show it regardless.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The todo page MUST load todos from the server on mount and display them.
- **FR-002**: The todo page MUST show a loading state while todos are being fetched.
- **FR-003**: The todo page MUST show an error state with retry option when initial load fails.
- **FR-004**: Users MUST be able to create a new todo from the todo page via the floating action button, providing at minimum a title.
- **FR-005**: Users MUST be able to toggle a todo's completion status and have it persisted to the server.
- **FR-006**: Users MUST be able to edit a todo's title and description and save changes to the server.
- **FR-007**: Users MUST be able to change a todo's priority and have it persisted to the server.
- **FR-008**: Users MUST be able to delete a todo and have it removed from the server.
- **FR-009**: All server operations MUST show a success or failure toast notification.
- **FR-010**: Priority values in the UI (1=Highest through 5=Lowest) MUST map correctly to and from the server's named priority enum.
- **FR-011**: The completion toggle MUST map correctly to the server's status values.
- **FR-012**: The block promotion button on TASK-type block cards MUST call the server to create a todo from the block.

### Key Entities

- **Todo**: A user task with id, title, optional description, priority (5 levels), and status (active or completed). Owned by the authenticated user.
- **Block** (existing): A content block. When type is TASK, it can be promoted to a Todo via a server action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All todo operations (load, create, update, delete) persist across page refreshes.
- **SC-002**: Users receive clear feedback (success/error toast) for every server operation.
- **SC-003**: The todo page shows only real server data — no mock or stale data after initial load.
- **SC-004**: Priority mapping between the UI's 1-5 numeric scale and the server's named enum is lossless.
- **SC-005**: Block promotion results in a visible todo on the todo page without requiring a hard reload.

## Assumptions

- Authentication is handled; the shared HTTP client includes the bearer token automatically.
- The backend todo API is fully implemented with endpoints: GET /todos, POST /todos, PATCH /todos/:id, DELETE /todos/:id, POST /todos/from-block/:blockId.
- blocksApi.promoteToTodo() is already wired to the correct endpoint — only the todo page CRUD API client needs to be created.
- Toast notifications use Sonner (already installed and configured).
- Priority mapping: UI value 1 = HIGHEST, 2 = HIGH, 3 = MEDIUM, 4 = LOW, 5 = LOWEST.
- The todo page filter tabs (All / Active / Completed) map to: All = no filter, Active = status ACTIVE, Completed = status COMPLETED.
