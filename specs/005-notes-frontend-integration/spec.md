# Feature Specification: Notes Page Frontend–Backend Integration

**Feature Branch**: `005-notes-frontend-integration`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "we need to integrate frontend(remove mock data and integrate it with real data from the backend). Everywhere where we have the mock data on the frontend in notes page we need to make it real calls, real data, in constitution.md you can find all the functionality. On the backend also."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Persisted Storages on Load (Priority: P1)

When a logged-in user opens the Notes page, the storage tree is loaded from the backend and reflects the user's real data — not hardcoded mock storages. The tree survives page refreshes and is always consistent with what the backend has stored.

**Why this priority**: This is the foundational blocker. Every other operation depends on having real, persisted storage data displayed on the page. Without this, creating, deleting, or selecting a storage has no durability.

**Independent Test**: Open the Notes page after logging in. The sidebar must show storages previously created by the user (or be empty on a fresh account). Refreshing the page must show the same storages, not mock data.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no storages, **When** the Notes page loads, **Then** the sidebar shows an empty state (no mock storages appear).
2. **Given** a logged-in user with existing storages, **When** the Notes page loads, **Then** the sidebar displays the user's storages with correct hierarchy and names.
3. **Given** a logged-in user, **When** the Notes page is loading data, **Then** a loading indicator is visible until the data arrives.
4. **Given** a network error during load, **When** the data fetch fails, **Then** an error message is shown and the user can retry.

---

### User Story 2 - Create and Delete Storages via Backend (Priority: P2)

When a logged-in user creates a new storage (root or nested) or deletes an existing one, the change is persisted on the backend. The UI reflects the updated state after the operation completes.

**Why this priority**: Storages are the primary organisational unit. Without real persistence, any storage created is lost on refresh. Deletion must also cascade correctly (handled by backend).

**Independent Test**: Create a root storage, refresh the page — it must still appear. Create a nested storage inside it, refresh — both must appear with correct hierarchy. Delete the root storage — both disappear after refresh.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they enter a name and confirm a new root storage, **Then** the storage is saved and appears in the sidebar immediately after the API call succeeds.
2. **Given** a logged-in user, **When** they create a nested storage inside an existing one, **Then** the nested storage is persisted with the correct parent relationship.
3. **Given** a logged-in user, **When** they delete a storage, **Then** the storage and all its children and their notes are removed from both the UI and the backend.
4. **Given** an API error during create, **When** the request fails, **Then** the storage does not appear in the sidebar and an error message is shown.
5. **Given** an API error during delete, **When** the request fails, **Then** the storage remains visible in the sidebar and an error message is shown.

---

### User Story 3 - View Notes Within a Storage (Priority: P3)

When a user selects a storage in the sidebar, the notes belonging to that storage are fetched from the backend and displayed. Notes appear under the correct storage in the tree and persist across page reloads.

**Why this priority**: Notes are the core content. Once storages are real, notes must follow. Displaying real notes from the backend completes the read-path for the feature.

**Independent Test**: Select a storage that has existing notes. The notes must appear in the tree without manual refresh. Reload the page, select the same storage, and the same notes must reappear.

**Acceptance Scenarios**:

1. **Given** a logged-in user selects a storage, **When** the storage is opened, **Then** the notes belonging to that storage are fetched and displayed in the tree.
2. **Given** a storage with no notes, **When** it is selected, **Then** no notes appear (empty state), not leftover mock notes.
3. **Given** the page is refreshed after viewing a storage, **When** the user re-selects the storage, **Then** the same notes appear.

---

### User Story 4 - Create, Edit, and Delete Notes via Backend (Priority: P4)

When a user creates a new note, edits an existing note's title or content, or deletes a note, the change is persisted on the backend. The UI reflects the updated state after each operation.

**Why this priority**: This completes the full CRUD loop. Create/Edit/Delete of notes without backend persistence is meaningless — the write-path must work end-to-end.

**Independent Test**: Create a note in a storage, refresh the page — the note must still be there. Edit the note, refresh — the updated content must appear. Delete the note, refresh — the note must be gone.

**Acceptance Scenarios**:

1. **Given** a logged-in user selects a storage, **When** they create a note with a title, **Then** the note is saved to the backend and appears in the tree immediately.
2. **Given** a user opens an existing note and edits its title or content, **When** they save, **Then** the updated note is persisted and reflects the new data.
3. **Given** a user deletes a note, **When** deletion succeeds, **Then** the note is removed from the sidebar and from the backend.
4. **Given** an API error during note create or update, **When** the request fails, **Then** the note is not added/modified in the UI and an error message is shown.
5. **Given** an API error during note delete, **When** the request fails, **Then** the note remains visible and an error message is shown.

---

### Edge Cases

- What happens if the user deletes a storage while viewing one of its notes? The editor closes and the main view resets to the empty state.
- What happens when two tabs are open and a storage is deleted in one? The other tab may show stale data — a refresh resolves it (no real-time sync required in MVP).
- What if the user clicks "Save" while a previous save is still in flight? The Save button is disabled until the in-flight request completes.
- What if the access token expires mid-session? The existing http-client handles token refresh and redirects to login on failure — no extra handling needed in this feature.
- What happens when a network request is pending and the user navigates away? Pending requests are abandoned (no cancellation UX required in MVP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Notes page MUST fetch the authenticated user's storages from the backend on initial load and display them in the sidebar tree.
- **FR-002**: The sidebar MUST show an empty state when the user has no storages, with no hardcoded mock data appearing.
- **FR-003**: Creating a storage (root or nested) MUST persist the storage on the backend before adding it to the local state.
- **FR-004**: Deleting a storage MUST call the backend delete endpoint; the storage and its children MUST be removed from the sidebar only after a successful response.
- **FR-005**: Selecting a storage MUST fetch the notes belonging to that storage from the backend and display them in the tree under the storage.
- **FR-006**: Creating a note MUST persist the note on the backend; the note MUST be added to the sidebar only after a successful response.
- **FR-007**: Saving an edited note (title and/or content) MUST persist the changes on the backend before updating the local state.
- **FR-008**: Deleting a note MUST call the backend delete endpoint; the note MUST be removed from the sidebar only after a successful response.
- **FR-009**: All API interactions MUST use the existing authenticated HTTP client (`request()` from the shared API layer).
- **FR-010**: The page MUST display a loading indicator while the initial storage list is being fetched.
- **FR-011**: Any API error (network error or non-2xx response) MUST result in a user-visible error notification.
- **FR-012**: All operations MUST preserve the existing UI interaction model (tree expand/collapse, FAB for note creation, inline storage name input).

### Key Entities

- **Storage**: A named container that can hold notes and child storages. Has an identifier, name, owner, and optional parent reference. Persisted on the backend.
- **Note**: A titled content document that belongs to exactly one storage. Has an identifier, title, content, and storage reference. Persisted on the backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After refreshing the Notes page, all previously created storages and their hierarchy appear correctly — zero data loss.
- **SC-002**: After refreshing the Notes page, all previously created notes appear under their correct storage — zero data loss.
- **SC-003**: Storage and note creation, update, and deletion each complete within 3 seconds under normal network conditions.
- **SC-004**: All API errors surface as visible user feedback within 1 second of the failure, with no silent failures or broken UI state.
- **SC-005**: Zero hardcoded or mock storage/note data appears on any user's Notes page after this feature is implemented.

## Assumptions

- The backend API endpoints from `004-notes-storage-api` are fully deployed and stable: `GET/POST/DELETE /storages` and `GET/POST/PATCH/DELETE /notes`.
- Notes are fetched per-storage when a storage is selected, not all at once on page load, to avoid loading all user notes upfront.
- The expanded/collapsed state of storage nodes is UI-only (not persisted to the backend).
- No pagination is implemented in this MVP — all storages for the user and all notes for a given storage are fetched in a single request.
- Error messages are displayed using the existing toast/notification pattern already established in the frontend (Sonner).
- The Graph view (Network icon in the sidebar header) is out of scope — it remains a non-functional button.
- Optimistic updates are not required; all UI changes occur only after a successful API response.
