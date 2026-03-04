# Research: Notes Page Frontend–Backend Integration

## Decision 1: Data Fetching Pattern

**Decision**: Use `useEffect` + local `useState` within the existing `NotesPage` component, calling the API layer from `shared/api/`.

**Rationale**: This matches the exact pattern already used by `BlocksClient` (`blocks-list` widget), which loads data with `useEffect`, stores it in `useState`, and uses `toast` for error feedback. Introducing a new pattern (e.g., SWR, React Query, custom hooks) would add a dependency and deviate from the established codebase convention without justification.

**Alternatives considered**:
- React Query / SWR: Adds a dependency and caching complexity not needed for an MVP with simple CRUD operations.
- Server Components + fetch: The notes page is `'use client'` (uses browser-side drag, state, etc.); server-side fetching is not viable without a major refactor.
- Custom `useStorages`/`useNotes` hooks: Useful for future reuse but adds abstraction complexity for a single-use case. Not needed now.

---

## Decision 2: API Client Location

**Decision**: Create `shared/api/storages.api.ts` and `shared/api/notes.api.ts` (two separate files, mirroring `shared/api/blocks.api.ts`).

**Rationale**: `blocks.api.ts` is the established pattern — a plain TypeScript module that calls `request()` and exports a typed API object. Two separate files keep storage and note concerns distinct and independently testable.

**Alternatives considered**:
- Single `notes-storage.api.ts`: Slightly simpler, but mixes two distinct domains in one file, against the principle of separation of concerns.
- Inline fetch calls in the component: Against the project convention; all API calls live in `shared/api/`.

---

## Decision 3: Note Loading Strategy

**Decision**: Fetch notes per-storage when a storage is selected (`openStorage`), not all notes on page load. Cache loaded notes in a `Map<storageId, Note[]>` held in component state to avoid re-fetching on re-select.

**Rationale**: Fetching all notes on page load could be expensive for users with many notes across many storages. The per-storage load matches the UX intent (notes are only displayed when a storage is selected). A simple in-memory cache prevents redundant network calls.

**Alternatives considered**:
- Load all notes on mount: Simpler but wastes bandwidth and adds latency on page load.
- Fetch on every open (no cache): Simple but causes flickering and redundant requests when toggling between storages.
- Persistent cache (localStorage): Overly complex for MVP; risk of stale data.

---

## Decision 4: Error Handling Strategy

**Decision**: Use `toast.error()` from Sonner for all API errors during mutations (create storage, delete storage, create note, save note, delete note). For the initial page load error (GET /storages), show an inline error state with a retry button, matching the pattern in `BlocksClient`.

**Rationale**: `toast.error()` is already used throughout the app (blocks-client, profile-form) for mutation errors. The initial load error uses an inline banner (also matching `BlocksClient`) because the whole page is empty and a toast would be insufficient feedback.

**Alternatives considered**:
- Toast for all errors including load: Inconsistent with BlocksClient; user may miss a toast on initial load.
- Inline error for all mutations: Disruptive to the layout; toasts are non-blocking and more appropriate for mutation feedback.

---

## Decision 5: Mutation Safety (Button Disable During In-Flight Requests)

**Decision**: Track per-operation loading state (`saving`, `deleting`) to disable action buttons while requests are in flight. The Save button is disabled until the note title is non-empty AND no save is in progress.

**Rationale**: Prevents duplicate submissions and matches the spec edge case requirement. Matches the `saving` pattern from `ProfileForm`.

**Alternatives considered**:
- Global loading lock: Overly restrictive; prevents unrelated UI interactions.
- No tracking (rely on debounce): Error-prone; users can still double-click before debounce fires.

---

## Decision 6: Storage Delete — Client-Side Cascade

**Decision**: After a successful `DELETE /storages/:id` response, remove the deleted storage and ALL its descendants from local state client-side (using the existing `getChildrenIds` recursive helper already in the component). Notes cached for deleted storages are also purged from the notes cache.

**Rationale**: The backend handles DB cascade automatically. The frontend must mirror this by removing all affected storages and their cached notes from local state to keep the UI consistent without a full re-fetch.

**Alternatives considered**:
- Full re-fetch after delete: Simpler but causes a visible loading flash; unnecessary given we know exactly what was deleted.
- Only remove the top-level storage and re-fetch: Incomplete; leaves orphaned child entries in state until refresh.

---

## Decision 7: Expanded State Preservation

**Decision**: The `expanded` property on storages remains UI-only local state and is NOT persisted to the backend (the backend doesn't have an `expanded` field). After creating a new storage, it starts collapsed. After loading storages from the backend, all storages start collapsed.

**Rationale**: Matches the spec assumption. The backend `Storage` model has no `expanded` field. Persisting UI state to the backend would require a new API field and migration — not in scope.

**Alternatives considered**:
- LocalStorage persistence of expanded state by storage ID: Could be a nice-to-have but is out of MVP scope.
- All loaded storages start expanded: Confusing UX for users with many storages; collapsed-by-default is cleaner.

---

## Decision 8: Frontend Tests

**Decision**: Add Vitest + @testing-library/react component tests for the new API modules (`storages.api.ts`, `notes.api.ts`) and a smoke test for the `NotesPage` component verifying the loading state and that mock storages are NOT rendered.

**Rationale**: Constitution Principle V requires tests for all new features. The existing test (`profile-form.test.tsx`) uses Vitest + @testing-library/react. API module tests use `vi.mock` on `http-client`. Component tests mock the API modules.

**Alternatives considered**:
- E2E Playwright tests only: E2E is slower and more brittle; unit/component tests are more appropriate for API module logic.
- No tests: Violates Principle V.
