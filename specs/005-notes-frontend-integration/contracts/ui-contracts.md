# UI Contracts: Notes Page Frontend–Backend Integration

> This document describes the interface contracts between the new API client modules and the `NotesPage` component.

## API Client Contracts

### storagesApi (shared/api/storages.api.ts)

```typescript
interface StorageResponse {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateStorageBody {
  name: string;
  parentId?: string;
}

const storagesApi = {
  getStorages(): Promise<StorageResponse[]>
  // GET /storages — returns all storages for the authenticated user

  createStorage(body: CreateStorageBody): Promise<StorageResponse>
  // POST /storages — creates a new storage; throws ApiRequestError on failure

  deleteStorage(id: string): Promise<void>
  // DELETE /storages/:id — deletes storage and cascades on backend; throws ApiRequestError on failure
}
```

**Error conditions**:
- `GET /storages` 401: redirect to login (handled by http-client)
- `POST /storages` 404: parent storage not found (show toast error)
- `POST /storages` 422: validation error (show toast with message)
- `DELETE /storages/:id` 404: storage not found (show toast error; storage may have already been deleted)

---

### notesApi (shared/api/notes.api.ts)

```typescript
interface NoteResponse {
  id: string;
  title: string;
  content: string;
  storageId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteBody {
  title: string;
  content?: string;
  storageId: string;
}

interface UpdateNoteBody {
  title?: string;
  content?: string;
}

const notesApi = {
  getNotesByStorage(storageId: string): Promise<NoteResponse[]>
  // GET /notes?storageId=:id — returns notes for a specific storage

  createNote(body: CreateNoteBody): Promise<NoteResponse>
  // POST /notes — creates a new note; throws ApiRequestError on failure

  updateNote(id: string, body: UpdateNoteBody): Promise<NoteResponse>
  // PATCH /notes/:id — updates note title/content; throws ApiRequestError on failure

  deleteNote(id: string): Promise<void>
  // DELETE /notes/:id — deletes note; throws ApiRequestError on failure
}
```

**Error conditions**:
- `GET /notes` 401: redirect to login (handled by http-client)
- `POST /notes` 404: storageId not found or belongs to another user (show toast error)
- `POST /notes` 422: validation error — empty title (show toast with message)
- `PATCH /notes/:id` 404: note not found (show toast; close editor)
- `DELETE /notes/:id` 404: note already deleted (remove from state silently)

---

## Component State Contract

### NotesPage Internal State (after integration)

| State Variable          | Type                              | Description                                      |
|-------------------------|-----------------------------------|--------------------------------------------------|
| `storages`              | `StorageItem[]`                   | Loaded from backend; `expanded` is UI-only       |
| `notesCache`            | `Map<string, NoteItem[]>`         | Notes per storageId; populated on storage open   |
| `loadingStorages`       | `boolean`                         | True while initial GET /storages is in flight    |
| `storagesError`         | `string \| null`                  | Error message for initial load failure           |
| `selectedStorageId`     | `string \| null`                  | Currently selected storage                       |
| `selectedNoteId`        | `string \| null`                  | Currently selected note                          |
| `isCreatingNote`        | `boolean`                         | Whether the create-note editor is open           |
| `draftNote`             | `{ title: string, content: string }` | Editor draft state                            |
| `creatingStorageParentId` | `string \| null \| undefined`   | undefined = not creating; null = root; id = child |
| `newStorageName`        | `string`                          | Inline storage name input value                  |
| `saving`                | `boolean`                         | True while save note request is in flight        |

---

## Behavioral Contracts

### On Page Mount
1. Set `loadingStorages = true`
2. Call `storagesApi.getStorages()`
3. On success: set `storages` (with `expanded: false` for all), set `loadingStorages = false`
4. On error: set `storagesError`, set `loadingStorages = false`

### On Storage Open (`openStorage(id)`)
1. Set `selectedStorageId = id`, clear note selection
2. If `notesCache.has(id)`: skip fetch (use cached)
3. If not cached: call `notesApi.getNotesByStorage(id)`, store result in `notesCache`
4. On error: show `toast.error()`

### On Create Storage (`confirmAddStorage()`)
1. Call `storagesApi.createStorage({ name, parentId })`
2. On success: append to `storages` state with `expanded: false`
3. On error: show `toast.error()`, do NOT modify state

### On Delete Storage (`handleDeleteStorage(id)`)
1. Call `storagesApi.deleteStorage(id)`
2. On success: remove storage and all descendants from `storages`, purge their entries from `notesCache`
3. On error: show `toast.error()`, do NOT modify state
4. If selected storage/note was deleted: reset selection

### On Create Note (Save in create mode)
1. Set `saving = true`
2. Call `notesApi.createNote({ title, content, storageId: selectedStorageId })`
3. On success: add note to `notesCache[storageId]`, set `selectedNoteId` to new note's id, set `isCreatingNote = false`
4. On error: show `toast.error()`
5. Always: set `saving = false`

### On Update Note (Save in edit mode)
1. Set `saving = true`
2. Call `notesApi.updateNote(selectedNoteId, { title, content })`
3. On success: update note in `notesCache`
4. On error: show `toast.error()`
5. Always: set `saving = false`

### On Delete Note (`handleDeleteNote(id)`)
1. Call `notesApi.deleteNote(id)`
2. On success: remove note from `notesCache[storageId]`, clear selection if it was selected
3. On error: show `toast.error()`, do NOT modify state
