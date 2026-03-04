# Tasks: Notes Page Frontend–Backend Integration

**Input**: Design documents from `/specs/005-notes-frontend-integration/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ui-contracts.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All paths are relative to `apps/web/src/`

---

## Phase 1: Setup

**Purpose**: Verify test infrastructure is in place for new test files

- [X] T001 Verify Vitest config in apps/web/vite.config.ts (or vitest.config.ts) covers `shared/api/__tests__/` and `pages-flat/notes/ui/__tests__/` glob patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the two API client modules that all user stories depend on

**⚠️ CRITICAL**: All US phases depend on these API modules. Complete before any user story work.

- [X] T002 [P] Create apps/web/src/shared/api/storages.api.ts — define `StorageResponse` interface (`id`, `name`, `parentId: string | null`, `createdAt`, `updatedAt`), `CreateStorageBody` interface (`name: string`, `parentId?: string`), and `storagesApi` object with `getStorages(): Promise<StorageResponse[]>` (GET /storages), `createStorage(body): Promise<StorageResponse>` (POST /storages), `deleteStorage(id): Promise<void>` (DELETE /storages/:id) — import `request` from `./http-client`
- [X] T003 [P] Create apps/web/src/shared/api/notes.api.ts — define `NoteResponse` interface (`id`, `title`, `content`, `storageId`, `createdAt`, `updatedAt`), `CreateNoteBody` (`title: string`, `content?: string`, `storageId: string`), `UpdateNoteBody` (`title?: string`, `content?: string`), and `notesApi` object with `getNotesByStorage(storageId): Promise<NoteResponse[]>` (GET /notes?storageId=:id), `createNote(body): Promise<NoteResponse>` (POST /notes), `updateNote(id, body): Promise<NoteResponse>` (PATCH /notes/:id), `deleteNote(id): Promise<void>` (DELETE /notes/:id) — import `request` from `./http-client`
- [X] T004 [P] Write unit tests in apps/web/src/shared/api/__tests__/storages.api.test.ts — use `vi.mock('@/shared/api/http-client')` to mock `request`; test: `getStorages` calls GET `/storages` and returns array; `createStorage` calls POST `/storages` with correct body; `deleteStorage` calls DELETE `/storages/:id`
- [X] T005 [P] Write unit tests in apps/web/src/shared/api/__tests__/notes.api.test.ts — use `vi.mock('@/shared/api/http-client')` to mock `request`; test: `getNotesByStorage` calls GET `/notes?storageId=:id`; `createNote` calls POST `/notes` with body; `updateNote` calls PATCH `/notes/:id` with body; `deleteNote` calls DELETE `/notes/:id`

**Checkpoint**: Both API modules exist and their unit tests pass — user story implementation can now begin

---

## Phase 3: User Story 1 — View Persisted Storages on Load (Priority: P1) 🎯 MVP

**Goal**: Replace the hardcoded `initialStorages` mock data with real data fetched from the backend on mount. Show a loading indicator while fetching and an inline error state on failure.

**Independent Test**: Navigate to `/notes` with a fresh account → sidebar is empty (no mock data). Navigate with an account that has storages → real storages appear. Refresh → same storages still appear.

- [X] T006 [P] [US1] Write component smoke tests in apps/web/src/pages-flat/notes/ui/__tests__/notes-page.test.tsx — mock `@/shared/api/storages.api` and `@/shared/api/notes.api`; test: (1) shows loading state while storagesApi.getStorages is pending; (2) shows empty sidebar when API resolves with `[]` and the text "Storage Level 1" is NOT in the DOM; (3) shows error message when getStorages rejects
- [X] T007 [US1] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: (a) remove `initialStorages` constant and `initialNotes` constant; (b) change `storages` initial state from `initialStorages` to `[]`; (c) add `loadingStorages` state (boolean, initially true) and `storagesError` state (string | null, initially null); (d) import `storagesApi` from `@/shared/api/storages.api` and `StorageResponse` type; (e) update `Storage` local type to remove `expanded` or keep and merge — keep `expanded: boolean` as UI-only field added when setting state
- [X] T008 [US1] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: add `useEffect` that calls `storagesApi.getStorages()` on mount — on success: `setStorages(data.map(s => ({ ...s, expanded: false })))`, `setStoragesError(null)`, `setLoadingStorages(false)`; on error: `setStoragesError(err.message ?? 'Failed to load storages.')`, `setLoadingStorages(false)`
- [X] T009 [US1] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: add loading state render in the sidebar — when `loadingStorages` is true, show skeleton/spinner in place of the storage tree (e.g., 3 animated-pulse divs inside the sidebar's scroll area); add error state render — when `storagesError` is non-null, show error message with a "Retry" button that re-calls `storagesApi.getStorages()` and resets the error/loading state

**Checkpoint**: US1 is complete — the sidebar loads real storages from the backend; mock data is gone; loading and error states work

---

## Phase 4: User Story 2 — Create and Delete Storages via Backend (Priority: P2)

**Goal**: Wire create-storage and delete-storage operations to the backend API. UI only updates state after a successful response; errors are shown as toasts.

**Independent Test**: Create a root storage → refresh page → still appears. Create nested storage → refresh → hierarchy preserved. Delete root → refresh → both root and child gone.

- [X] T010 [US2] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `confirmAddStorage()` to async — call `storagesApi.createStorage({ name: newStorageName.trim(), parentId: creatingStorageParentId ?? undefined })`; on success: append `{ ...created, expanded: false }` to `storages` state and expand parent if nested; on error: call `toast.error(err.message ?? 'Failed to create storage.')` and do NOT update state; import `toast` from `sonner` if not already imported
- [X] T011 [US2] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `handleDeleteStorage()` to async — call `storagesApi.deleteStorage(id)`; on success: compute `idsToDelete` (id + all descendants using the existing `getChildrenIds` helper), then `setStorages(prev => prev.filter(s => !idsToDelete.includes(s.id)))` and reset selection if selected storage was deleted; on error: call `toast.error(err.message ?? 'Failed to delete storage.')` and do NOT update state

**Checkpoint**: US2 complete — storage create/delete persists across refreshes; errors show as toasts

---

## Phase 5: User Story 3 — View Notes Within a Storage (Priority: P3)

**Goal**: When a storage is selected, fetch its notes from the backend and cache them per-storage to avoid redundant requests.

**Independent Test**: Select a storage with existing backend notes → notes appear in tree. Re-select same storage → no second network request (cached). Refresh page and re-select → notes reappear.

- [X] T012 [US3] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: (a) remove `notes` useState; (b) add `notesCache` state as `useState<Map<string, NoteResponse[]>>(() => new Map())`; (c) import `NoteResponse` from `@/shared/api/notes.api` and use it as the note type throughout the component; (d) update all `notes.filter(...)` and `notes.find(...)` references to use `notesCache.get(selectedStorageId ?? '') ?? []` or derive from cache appropriately
- [X] T013 [US3] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `openStorage(id)` to async — after setting `selectedStorageId`: if `notesCache.has(id)` skip fetch; otherwise call `notesApi.getNotesByStorage(id)`; on success: `setNotesCache(prev => new Map(prev).set(id, data))`; on error: `toast.error(err.message ?? 'Failed to load notes.')`; import `notesApi` from `@/shared/api/notes.api`

**Checkpoint**: US3 complete — notes load per-storage from backend; cache prevents duplicate fetches

---

## Phase 6: User Story 4 — Create, Edit, and Delete Notes via Backend (Priority: P4)

**Goal**: Wire create-note, update-note, and delete-note operations to the backend API. All state changes occur only after a successful response; `saving` state prevents double-submit.

**Independent Test**: Create note → refresh → still there. Edit note → refresh → updated content. Delete note → refresh → gone. Try to save with empty title → button disabled.

- [X] T014 [US4] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: add `saving` state (boolean, initially false); disable the Save button when `saving` is true (change `disabled={!draftNote.title.trim()}` to `disabled={!draftNote.title.trim() || saving}` and update button text to show "Saving..." while in flight)
- [X] T015 [US4] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `handleSaveNote()` create-note path to async — when `isCreatingNote && selectedStorageId`: set `saving=true`, call `notesApi.createNote({ title: draftNote.title, content: draftNote.content, storageId: selectedStorageId })`; on success: update `notesCache` by appending new note to the storage's list, set `selectedNoteId = created.id`, set `isCreatingNote = false`; on error: `toast.error(err.message ?? 'Failed to create note.')`; always set `saving=false`
- [X] T016 [US4] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `handleSaveNote()` update-note path to async — when `selectedNoteId`: set `saving=true`, call `notesApi.updateNote(selectedNoteId, { title: draftNote.title, content: draftNote.content })`; on success: update `notesCache` by replacing the note in its storage's list; on error: `toast.error(err.message ?? 'Failed to save note.')`; always set `saving=false`
- [X] T017 [US4] In apps/web/src/pages-flat/notes/ui/notes-page.tsx: convert `handleDeleteNote(id)` to async — determine the note's `storageId` by searching `notesCache` values; call `notesApi.deleteNote(id)`; on success: update `notesCache` by removing the note from its storage's list; clear `selectedNoteId` if deleted note was selected; on error: `toast.error(err.message ?? 'Failed to delete note.')`; do NOT update state on error

**Checkpoint**: US4 complete — full note CRUD persists to backend; all operations are safe (no double-submit, errors toasted)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Remove dead code, verify all edge cases, run full test suite

- [X] T018 Remove `generateId()` helper function from apps/web/src/pages-flat/notes/ui/notes-page.tsx (no longer used)
- [X] T019 Verify edge case in apps/web/src/pages-flat/notes/ui/notes-page.tsx: when a storage is deleted while its note is open in the editor — confirm `selectedStorageId` and `selectedNoteId` are cleared and notes cache entries for deleted storage IDs are purged (update `handleDeleteStorage` if needed to also clear `notesCache` entries for `idsToDelete`)
- [X] T020 Run `yarn test` in apps/web and fix any type errors or test failures — ensure all 3 new test files pass (storages.api.test.ts, notes.api.test.ts, notes-page.test.tsx)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories; T002/T003 can run in parallel, T004/T005 can run in parallel with T002/T003 respectively
- **US1 (Phase 3)**: Depends on T002 (storages.api.ts) — T006 can run in parallel with T007
- **US2 (Phase 4)**: Depends on US1 (same file), T002 (storages.api.ts)
- **US3 (Phase 5)**: Depends on US2 (same file), T003 (notes.api.ts)
- **US4 (Phase 6)**: Depends on US3 (same file), T003 (notes.api.ts)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies (within notes-page.tsx)

All US phases modify the same file sequentially:
- **US1** adds load state + useEffect → **US2** converts create/delete handlers → **US3** replaces notes state with cache → **US4** converts note CRUD handlers

### Parallel Opportunities

- T002 and T003 (API files): fully parallel — different files
- T004 and T005 (API tests): fully parallel — different files
- T006 (component test) and T007 (notes-page changes): parallel start since T006 mocks the API

---

## Parallel Execution Example: Phase 2 (Foundational)

```bash
# These four tasks can all run simultaneously:
Task A: "Create storages.api.ts"                        → T002
Task B: "Create notes.api.ts"                           → T003
Task C: "Write storages.api unit tests"                 → T004
Task D: "Write notes.api unit tests"                    → T005
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete T002 (storages.api.ts only — the minimum needed)
3. Complete Phase 3: US1 (T007–T009) — remove mock data, add real load
4. **STOP and VALIDATE**: Open `/notes` in browser — no mock storages, real data loads
5. This alone eliminates the mock data problem

### Incremental Delivery

1. T001 → T002 + T003 → Foundation ready
2. T007–T009: Storages load from backend (US1 MVP)
3. T010–T011: Create/delete storages persist (US2)
4. T012–T013: Notes visible per storage (US3)
5. T014–T017: Full note CRUD (US4)
6. T018–T020: Polish + tests

---

## Notes

- All 4 user story phases modify `apps/web/src/pages-flat/notes/ui/notes-page.tsx` — execute sequentially
- T002, T003, T004, T005 are in separate files — fully parallelizable
- `expanded` field stays client-only; all storages loaded from backend start with `expanded: false`
- `toast` import from `sonner` — already used in other features, no new dependency needed
- No backend changes required — all backend endpoints from `004-notes-storage-api` are already deployed
