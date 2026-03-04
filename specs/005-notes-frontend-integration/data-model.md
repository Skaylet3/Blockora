# Data Model: Notes Page Frontend–Backend Integration

> **Note**: This feature does not introduce new backend data models. The `Storage` and `Note` entities were fully defined and migrated in `004-notes-storage-api`. This document describes the **frontend TypeScript types** that represent those entities in the UI layer.

## Frontend Types

### StorageItem (UI type in NotesPage)

The frontend extends the backend `Storage` model with a UI-only `expanded` field.

| Field      | Type              | Source   | Description                                     |
|------------|-------------------|----------|-------------------------------------------------|
| id         | string (UUID)     | Backend  | Unique identifier                               |
| name       | string            | Backend  | Display name of the storage                     |
| parentId   | string \| null   | Backend  | Parent storage ID; null for root storages        |
| createdAt  | string (ISO date) | Backend  | Creation timestamp (not displayed, used for sort)|
| updatedAt  | string (ISO date) | Backend  | Last update timestamp                           |
| expanded   | boolean           | UI-only  | Whether the node is expanded in the tree view   |

**Validation rules**:
- `name` must be a non-empty string (enforced by backend; frontend disables submit on empty input)
- `parentId` must be a UUID of an existing storage owned by the same user, or null

### NoteItem (UI type in NotesPage)

Matches the backend `Note` response exactly.

| Field      | Type              | Source   | Description                                     |
|------------|-------------------|----------|-------------------------------------------------|
| id         | string (UUID)     | Backend  | Unique identifier                               |
| title      | string            | Backend  | Note title                                      |
| content    | string            | Backend  | Note body text (may be empty)                   |
| storageId  | string (UUID)     | Backend  | Parent storage ID                               |
| createdAt  | string (ISO date) | Backend  | Creation timestamp                              |
| updatedAt  | string (ISO date) | Backend  | Last update timestamp                           |

**Validation rules**:
- `title` must be non-empty (frontend disables Save when title is empty; backend enforces `@MinLength(1)`)
- `storageId` must reference a storage owned by the current user

## API Response Shapes

These are the backend response types consumed by the frontend API client.

### StorageResponse (from GET /storages, POST /storages)

```
{
  id: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}
```

### NoteResponse (from GET /notes, POST /notes, PATCH /notes/:id)

```
{
  id: string
  title: string
  content: string
  storageId: string
  createdAt: string
  updatedAt: string
}
```

## Client-Side State

### Notes Cache

The `NotesPage` component maintains a `Map<storageId, NoteItem[]>` in state to cache notes per storage. This avoids re-fetching when toggling between storages.

**Invalidation rules**:
- When a note is created: append to cache entry for its `storageId`
- When a note is updated: replace in cache entry for its `storageId`
- When a note is deleted: remove from cache entry for its `storageId`
- When a storage is deleted: remove cache entries for the storage and all its descendants

## No Backend Schema Changes

The backend schema (`prisma/schema.prisma`) already contains:
- `Storage` model with `id`, `name`, `userId`, `parentId`, `createdAt`, `updatedAt`
- `Note` model with `id`, `title`, `content`, `userId`, `storageId`, `createdAt`, `updatedAt`

No migrations are required for this feature.
