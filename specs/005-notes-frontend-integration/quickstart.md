# Quickstart: Notes Page Frontend–Backend Integration

## Prerequisites

- Backend from `004-notes-storage-api` is deployed and accessible
- `NEXT_PUBLIC_API_BASE_URL` is set to the API base (e.g., `https://blockora-api.vercel.app/api`)
- User is authenticated (access + refresh tokens in localStorage)

## Running the Frontend Dev Server

```bash
cd apps/web
yarn dev
# or from repo root:
yarn workspace @blockora/web dev
```

## Running Tests

```bash
# All frontend tests
cd apps/web && yarn test

# Watch mode
yarn test --watch

# Specific file
yarn test src/shared/api/__tests__/storages.api.test.ts
```

## Key Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/src/shared/api/storages.api.ts` | New | API client for storages (GET, POST, DELETE) |
| `apps/web/src/shared/api/notes.api.ts` | New | API client for notes (GET, POST, PATCH, DELETE) |
| `apps/web/src/pages-flat/notes/ui/notes-page.tsx` | Modified | Replace mock data with API calls |
| `apps/web/src/shared/api/__tests__/storages.api.test.ts` | New | Unit tests for storages API client |
| `apps/web/src/shared/api/__tests__/notes.api.test.ts` | New | Unit tests for notes API client |
| `apps/web/src/pages-flat/notes/ui/__tests__/notes-page.test.tsx` | New | Component smoke tests for NotesPage |

## Integration Scenarios

### Scenario 1: Fresh Account — No Storages

1. Register a new account or clear the database for the test user
2. Navigate to `/notes`
3. Expected: sidebar shows empty state ("No storages yet" or similar); the two mock storages "Storage Level 1" and "Storage Level 2" do NOT appear

### Scenario 2: Create and Persist a Storage

1. Log in with an existing account
2. Navigate to `/notes`
3. Click the FolderPlus button in the sidebar header
4. Type a name and press Enter
5. Expected: storage appears in sidebar
6. Refresh the page
7. Expected: same storage still appears (not lost)

### Scenario 3: Create a Nested Storage

1. Hover over an existing storage
2. Click the FolderPlus button next to it
3. Enter a name and press Enter
4. Expected: nested storage appears indented under parent

### Scenario 4: Create and Edit a Note

1. Select a storage
2. Click the FAB (floating + button)
3. Enter a title and content, click Save
4. Expected: note appears in sidebar under storage
5. Click the note to open it, change the title, click Save
6. Expected: updated title appears in sidebar
7. Refresh the page — note and updated title persist

### Scenario 5: Delete a Storage with Children

1. Create a root storage, add a child storage, add a note to the child
2. Delete the root storage
3. Expected: both storages and the note disappear from sidebar
4. Refresh — they are gone

### Scenario 6: Error Handling

1. Disconnect from the network (or stop the API server)
2. Navigate to `/notes`
3. Expected: loading indicator appears, then inline error message with retry
4. Try to create a storage while offline
5. Expected: toast error message; storage does NOT appear in sidebar

## API Endpoints Used

| Operation | Method | Path | Body |
|-----------|--------|------|------|
| List storages | GET | /storages | — |
| Create storage | POST | /storages | `{ name, parentId? }` |
| Delete storage | DELETE | /storages/:id | — |
| List notes | GET | /notes?storageId=:id | — |
| Create note | POST | /notes | `{ title, content?, storageId }` |
| Update note | PATCH | /notes/:id | `{ title?, content? }` |
| Delete note | DELETE | /notes/:id | — |
