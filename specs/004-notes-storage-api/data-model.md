# Data Model: Notes & Storage API

**Feature**: 004-notes-storage-api | **Date**: 2026-03-04

---

## Entities

### Storage

A named container that can hold Notes and other Storages (unlimited nesting depth). Belongs to exactly one user.

| Field      | Type     | Required | Notes                                        |
|------------|----------|----------|----------------------------------------------|
| id         | UUID     | Yes      | Auto-generated primary key                   |
| name       | String   | Yes      | Non-empty; user-visible label for the folder |
| userId     | UUID FK  | Yes      | Owner; references User                       |
| parentId   | UUID FK? | No       | Null = root-level; references Storage (self) |
| createdAt  | DateTime | Yes      | Auto-set on creation                         |
| updatedAt  | DateTime | Yes      | Auto-updated on every write                  |

**Validation rules:**
- `name` must be non-empty (trimmed length > 0)
- `parentId`, when provided, must reference an existing Storage owned by the same user
- A Storage may not reference itself as parent

**State transitions:** No enum states — Storages are either present or permanently deleted (hard delete with cascade).

**Indexes:**
- `(userId)` — list all storages for a user
- `(userId, parentId)` — list children of a storage

**Cascade behavior:** Deleting a Storage hard-deletes all descendant Storages recursively (via DB-level `ON DELETE CASCADE` on the self-referential foreign key) and all Notes within any of those Storages (via `ON DELETE CASCADE` on Note's `storageId` FK).

---

### Note

A content item with a title and freeform text. Belongs to exactly one Storage and one user.

| Field      | Type     | Required | Notes                                     |
|------------|----------|----------|-------------------------------------------|
| id         | UUID     | Yes      | Auto-generated primary key                |
| title      | String   | Yes      | Non-empty; displayed in the tree view     |
| content    | String   | No       | Defaults to empty string; freeform text   |
| userId     | UUID FK  | Yes      | Owner; references User                    |
| storageId  | UUID FK  | Yes      | Container; references Storage             |
| createdAt  | DateTime | Yes      | Auto-set on creation                      |
| updatedAt  | DateTime | Yes      | Auto-updated on every write               |

**Validation rules:**
- `title` must be non-empty (trimmed length > 0)
- `storageId` must reference an existing Storage owned by the same user
- `content` is optional on create; defaults to `""`

**State transitions:** No soft-delete — Notes are hard-deleted (unlike Blocks which use a status enum).

**Indexes:**
- `(userId)` — ownership check and global user note list
- `(storageId)` — list all notes for a storage

---

## Entity Relationships

```
User ──┐
       ├── 1:N ──► Storage ──► (parentId, self-referential, nullable)
       │                  └── 1:N ──► Note
       └── 1:N ──► Note (direct ownership field)
```

- A User has zero or more Storages.
- A Storage has zero or one parent Storage (same owner).
- A Storage has zero or more child Storages.
- A Storage has zero or more Notes.
- A Note belongs to exactly one Storage and exactly one User.

---

## Prisma Schema (target)

```prisma
model Storage {
  id        String    @id @default(uuid())
  name      String
  userId    String
  parentId  String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user     User      @relation("UserStorages", fields: [userId], references: [id], onDelete: Cascade)
  parent   Storage?  @relation("StorageChildren", fields: [parentId], references: [id], onDelete: Cascade)
  children Storage[] @relation("StorageChildren")
  notes    Note[]

  @@index([userId])
  @@index([userId, parentId])
}

model Note {
  id        String   @id @default(uuid())
  title     String
  content   String   @default("")
  userId    String
  storageId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation("UserNotes", fields: [userId], references: [id], onDelete: Cascade)
  storage Storage @relation(fields: [storageId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([storageId])
}
```

**Note**: The `User` model must add back-relation fields:
```prisma
storages Storage[] @relation("UserStorages")
notes    Note[]    @relation("UserNotes")
```

---

## Migration

A single Prisma migration will be generated with:
1. `CREATE TABLE storages` with self-referential FK + indexes
2. `CREATE TABLE notes` with FK to `storages` (cascade) + indexes
3. `ALTER TABLE users ADD` back-relation fields (handled by Prisma schema only, no SQL change needed for back-relations)

The migration file lives at `apps/api/prisma/migrations/<timestamp>_add_storage_and_note/migration.sql`.
