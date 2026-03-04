# Feature Specification: Notes & Storage API

**Feature Branch**: `004-notes-storage-api`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "Look, at the constitution.md and at the frontend's page 'notes' with mock data, we need to make the part of this page that backend does not have(the data). Also consider adding tests on it(on the backend)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Storages (Priority: P1)

An authenticated user can create, list, and delete Storages. A Storage is a named container
(analogous to a folder) that may be nested inside another Storage or exist at the root level.
When a Storage is deleted, all its child Storages and contained Notes are permanently removed.
The user only ever sees their own Storages — no other user's data is accessible.

**Why this priority**: Storages are the foundational organizational unit. Without them, Notes
cannot be created. This is the prerequisite for every other user story.

**Independent Test**: Can be fully tested by creating, listing, and deleting storages via the
API and verifying that only the authenticated user's storages are returned.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no storages, **When** they create a root-level storage named "Work", **Then** a storage with that name is persisted and returned with a unique ID and no parent.
2. **Given** an existing root storage "Work", **When** the user creates a child storage "Projects" under "Work", **Then** the new storage is persisted with a parent reference pointing to "Work".
3. **Given** a storage with child storages and notes, **When** the user deletes that storage, **Then** the storage, all descendant storages, and all their notes are permanently removed.
4. **Given** two different authenticated users each with their own storages, **When** either user lists storages, **Then** each user sees only their own storages.

---

### User Story 2 - Manage Notes Within a Storage (Priority: P2)

An authenticated user can create, read, update, and delete Notes within a Storage. Each Note
has a title and freeform text content. A Note belongs to exactly one Storage. The user can
retrieve all notes inside a given storage, or fetch and edit a single note by its ID.

**Why this priority**: Notes are the primary content unit. This is the core value the product
delivers.

**Independent Test**: Can be fully tested by creating a storage first, then creating,
updating, and deleting notes within it, and verifying retrieval is scoped to that storage.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an existing storage, **When** they create a note with a title and content, **Then** the note is persisted and linked to that storage.
2. **Given** an existing note, **When** the user updates the title or content, **Then** the changes are persisted and the updated note is returned.
3. **Given** an existing note, **When** the user deletes it, **Then** the note is permanently removed and no longer appears in the storage's note list.
4. **Given** a note owned by another user, **When** the current user attempts to access or modify it, **Then** the request is rejected.

---

### User Story 3 - Retrieve Full Storage Tree (Priority: P3)

An authenticated user can retrieve their complete Storage hierarchy in a single request,
enabling the frontend tree view to render without multiple round-trips. The response is a flat
list where each item carries a reference to its parent (if any), and the frontend reconstructs
the visual tree from these relationships.

**Why this priority**: The frontend tree view requires knowledge of the full hierarchy. This
optimizes the initial page load experience.

**Independent Test**: Can be fully tested by creating a multi-level hierarchy of storages
and verifying the flat list response contains correct parent references for all nodes.

**Acceptance Scenarios**:

1. **Given** a user with a three-level nested storage hierarchy, **When** they request all storages, **Then** a flat list with all storages and their parent references is returned.
2. **Given** a user with no storages, **When** they request all storages, **Then** an empty list is returned.

---

### Edge Cases

- What happens when a user tries to create a Note in a Storage that belongs to another user? → Request must be rejected with an authorization error.
- What happens when a user tries to create a child Storage under a Storage that belongs to another user? → Request must be rejected.
- What happens when a Note's storage reference points to a Storage that does not exist? → Request must be rejected with a not-found error.
- What happens when deleting a Storage that is itself a child of another Storage? → Only the targeted storage subtree is deleted; the parent storage is unaffected.
- What happens when a note title is empty or whitespace-only? → Request must be rejected with a validation error.
- What happens when a storage name is empty or whitespace-only? → Request must be rejected with a validation error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow authenticated users to create a Storage with a name and an optional parent Storage ID (null for root-level).
- **FR-002**: The system MUST allow authenticated users to list all of their Storages as a flat collection with parent references, ordered consistently.
- **FR-003**: The system MUST allow authenticated users to delete a Storage; deletion MUST cascade to all descendant Storages and all Notes contained within any of them.
- **FR-004**: The system MUST allow authenticated users to create a Note with a title and content, linked to an existing Storage they own.
- **FR-005**: The system MUST allow authenticated users to list all Notes within a specific Storage they own.
- **FR-006**: The system MUST allow authenticated users to retrieve a single Note by ID.
- **FR-007**: The system MUST allow authenticated users to update a Note's title and/or content.
- **FR-008**: The system MUST allow authenticated users to delete a Note by ID.
- **FR-009**: All Storage and Note operations MUST be scoped to the authenticated user — cross-user access MUST be rejected.
- **FR-010**: Note title MUST be required and non-empty; the system MUST reject notes with a blank title.
- **FR-011**: Storage name MUST be required and non-empty; the system MUST reject storages with a blank name.
- **FR-012**: All new endpoints MUST have automated tests covering: successful operation, unauthenticated access, cross-user access rejection, and input validation failure.

### Key Entities

- **Storage**: A named container owned by a user. May optionally be nested inside another Storage owned by the same user. Can contain zero or more Notes and zero or more child Storages. Key attributes: `id`, `name`, optional parent reference, owner reference.
- **Note**: A content item owned by a user, belonging to exactly one Storage. Key attributes: `id`, `title`, `content`, storage reference, owner reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create, read, update, and delete both Storages and Notes entirely through the API without any manual database intervention.
- **SC-002**: All Storage and Note CRUD operations return a response in under 500ms under normal conditions.
- **SC-003**: Zero data leaks between users — automated tests confirm that one user cannot read, modify, or delete another user's Storages or Notes.
- **SC-004**: All new endpoints have automated test coverage for: successful operation, unauthenticated access rejection, cross-user access rejection, and input validation failure — 100% of these scenarios covered.
- **SC-005**: Deleting a Storage with nested children removes all descendant data in a single operation with no orphaned records remaining.

## Assumptions

- Storage renaming is **not** in scope for this feature; only create, list, and delete are required for Storages in this iteration.
- The `expanded` UI state (collapsed/expanded in the tree view) is frontend-only and is NOT persisted in the backend.
- No pagination is required for the MVP — all storages and notes for a user are returned in full list responses.
- The database schema will need to be extended with new Storage and Note tables, including a migration.
- Authentication is provided by the existing JWT-based auth system (feature `001-api-auth-swagger`). All new endpoints require a valid access token.
- The graph/mindmap view described in the constitution is **out of scope** for this feature; only the data API required to power the tree view is in scope.
