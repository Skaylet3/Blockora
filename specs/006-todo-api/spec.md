# Feature Specification: Todo API with Block Promotion

**Feature Branch**: `006-todo-api`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "add the functionality to the backend, on constitution you can see there's todo. User has his own todos. Each todo has it's own priority, 5 levels, Highest, High, Medium, Low, Lowest. Each todo has status, active, completed. Also each block with type 'task' on block page has it's own button on the frontend to add it to the todo, idk how but implement it to the backend, block is not directly task, but it can become one if user clicks this button, implement it. Task can be created, updated, deleted, read."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task CRUD Operations (Priority: P1)

A user manages their personal todo list by creating, viewing, updating, and deleting tasks. Each task has a title, an optional description, a priority level, and a status. Tasks belong exclusively to the authenticated user and are never visible to others.

**Why this priority**: Core functionality without which nothing else works. All other stories depend on the task data model existing and the CRUD endpoints being available.

**Independent Test**: Can be fully tested by directly calling the Tasks API endpoints and confirming tasks are persisted, retrieved, modified, and removed correctly. Delivers a working personal todo list.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they submit a new task with a title, priority, and optional description, **Then** the task is saved with status `active` and returned with a unique identifier.
2. **Given** an authenticated user with existing tasks, **When** they request their task list, **Then** they receive only their own tasks (never another user's) with all fields present.
3. **Given** an authenticated user with an existing task, **When** they update the task's title, description, priority, or status, **Then** the task reflects the new values.
4. **Given** an authenticated user with an existing task, **When** they delete the task, **Then** the task is permanently removed and no longer appears in their list.
5. **Given** an unauthenticated request, **When** any task endpoint is called, **Then** the request is rejected with an authentication error.
6. **Given** a user who does not own a task, **When** they attempt to read, update, or delete that task by its ID, **Then** the request is rejected with a not-found or authorization error.

---

### User Story 2 - Task Priority and Status Management (Priority: P2)

A user assigns priority levels to tasks and toggles their completion status. Priority represents urgency (five levels) and status tracks whether the task is still outstanding or done.

**Why this priority**: Priority and status are the core attributes that differentiate this todo system from a plain list. Without them the feature delivers no productivity value beyond basic storage.

**Independent Test**: Can be tested by creating tasks with each priority level and toggling status between `active` and `completed`, verifying the system stores and returns correct values.

**Acceptance Scenarios**:

1. **Given** a new task, **When** the user sets priority to any of `Highest`, `High`, `Medium`, `Low`, or `Lowest`, **Then** only these five values are accepted; any other value is rejected with a validation error.
2. **Given** a new task, **When** no priority is specified, **Then** the task defaults to `Medium` priority.
3. **Given** an `active` task, **When** the user marks it as completed, **Then** the task status changes to `completed` and the change is persisted.
4. **Given** a `completed` task, **When** the user marks it as active again, **Then** the task status reverts to `active`.
5. **Given** a task list, **When** the user filters by status `active`, **Then** only tasks with `active` status are returned.
6. **Given** a task list, **When** the user filters by status `completed`, **Then** only tasks with `completed` status are returned.

---

### User Story 3 - Block-to-Task Promotion (Priority: P3)

A user viewing a block of type `task` on the block detail page triggers a "Add to Todo" action. The backend accepts this promotion request and creates a new Task in the user's todo list derived from the block's content, without modifying the block itself.

**Why this priority**: This is the cross-domain bridge defined in the constitution. It provides the productivity loop where content captured in blocks flows into actionable tasks. It depends on P1 being complete but delivers distinct value.

**Independent Test**: Can be tested independently by calling the block-promotion endpoint with a valid block ID, then verifying a new task appears in the user's task list with the block's title as the task title. The block itself must remain unchanged.

**Acceptance Scenarios**:

1. **Given** an authenticated user who owns a block of type `task`, **When** they call the promote endpoint for that block, **Then** a new Task is created in their todo list with the block's title as the task title, `Medium` priority by default, and `active` status.
2. **Given** the promotion request in scenario 1, **When** the task is created, **Then** the block's data, type, and status are unchanged.
3. **Given** a block that does not have type `task`, **When** the promote endpoint is called, **Then** the request is rejected with a validation error.
4. **Given** a user who does not own the block, **When** they call the promote endpoint, **Then** the request is rejected.
5. **Given** a block that has already been promoted, **When** the promote endpoint is called again for the same block, **Then** a second independent task is created (promotion is idempotent from the block's perspective; tasks are independent entities).
6. **Given** the promote endpoint, **When** the caller optionally provides a priority override, **Then** the created task uses the provided priority instead of the default.

---

### Edge Cases

- What happens when a user tries to create a task with no title? → Rejected with a validation error; title is required.
- What happens when a user requests a task by ID that does not exist? → Returns a not-found error (no information about whether it belongs to another user is leaked).
- What happens when the promoted block's title is very long (e.g., over 500 characters)? → The task title is truncated to the system's maximum task title length (reasonable default: 500 characters) and the task is still created.
- What happens when a user deletes a block that was previously promoted to a task? → The task continues to exist independently; it is not deleted (Tasks are decoupled from Blocks).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create a task with a required title, optional description, a required priority (one of `Highest`, `High`, `Medium`, `Low`, `Lowest`), and an initial status of `active`.
- **FR-002**: System MUST default task priority to `Medium` when no priority is provided on creation.
- **FR-003**: System MUST allow authenticated users to retrieve their full list of tasks, optionally filtered by status (`active` or `completed`).
- **FR-004**: System MUST allow authenticated users to retrieve a single task by its unique identifier, returning a not-found error if it does not exist or belongs to another user.
- **FR-005**: System MUST allow authenticated users to update any combination of a task's title, description, priority, and status.
- **FR-006**: System MUST allow authenticated users to delete a task permanently by its unique identifier.
- **FR-007**: System MUST scope all task queries to the authenticated user; no user may access another user's tasks.
- **FR-008**: System MUST reject any priority value that is not one of the five defined levels with a validation error.
- **FR-009**: System MUST reject any status value that is not `active` or `completed` with a validation error.
- **FR-010**: System MUST provide a dedicated endpoint to promote a block of type `task` into a new Task, creating the task with the block's title and without modifying the block.
- **FR-011**: System MUST reject a promotion request if the referenced block does not have type `task`.
- **FR-012**: System MUST reject a promotion request if the authenticated user does not own the referenced block.
- **FR-013**: System MUST accept an optional priority override on the promotion endpoint; if absent, the created task defaults to `Medium` priority.
- **FR-014**: System MUST store each task with a creation timestamp and a last-updated timestamp.

### Key Entities

- **Task**: A discrete action item owned by a user. Attributes: unique identifier, title (required, max 500 characters), description (optional, freeform text), priority (`Highest` | `High` | `Medium` | `Low` | `Lowest`), status (`active` | `completed`), owner reference, creation timestamp, last-updated timestamp.
- **Block** (existing entity, read-only in this context): A content unit with a type field. When type is `task`, it may be promoted. The block data model is not modified by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, read, update, and delete tasks with all five priority levels and both status values without errors.
- **SC-002**: All task data is strictly scoped to the owning user; no cross-user data exposure occurs under any tested scenario.
- **SC-003**: Promoting a block of type `task` to a todo task completes successfully and the resulting task appears in the user's list within a single request-response cycle.
- **SC-004**: Validation errors are returned for all invalid inputs (wrong priority value, wrong status value, missing required title, non-task block promotion) with clear, descriptive messages.
- **SC-005**: Deleting a block that was previously promoted does not affect the corresponding task; tasks remain independently persistent.
- **SC-006**: The Tasks API endpoints are fully documented and discoverable via the existing API documentation interface.

## Assumptions

- Task title maximum length is 500 characters; description has no enforced length limit (reasonable default for an MVP).
- Promoting a block multiple times creates multiple independent tasks; there is no deduplication or link tracking between blocks and tasks.
- Tasks have no due dates, assignees, labels, or sub-tasks in this MVP (constitution Principle III: Simplicity Over Features).
- Task list ordering defaults to creation date descending (newest first); no custom sorting is required for the MVP.
- The block promotion endpoint is accessible to any authenticated user who owns the block; no additional permission layer is needed.
- Block type validation uses the existing block `type` field; the system already stores block types (including `task`) from prior features.
