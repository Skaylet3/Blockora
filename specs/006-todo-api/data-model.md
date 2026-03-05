# Data Model: Todo API with Block Promotion

**Feature**: 006-todo-api
**Date**: 2026-03-05

---

## New Enums

### TodoPriority
```
HIGHEST
HIGH
MEDIUM   ← default
LOW
LOWEST
```

### TodoStatus
```
ACTIVE      ← default (all new todos start active)
COMPLETED
```

---

## New Model: Todo

| Field       | Type           | Nullable | Default    | Constraint / Notes                              |
|-------------|----------------|----------|------------|-------------------------------------------------|
| id          | String (UUID)  | No       | uuid()     | Primary key                                     |
| userId      | String (UUID)  | No       | —          | FK → User.id, cascade delete on user removal    |
| title       | String (TEXT)  | No       | —          | Required, min 1 char                            |
| description | String (TEXT)  | Yes      | null       | Optional free-form text                         |
| priority    | TodoPriority   | No       | MEDIUM     | One of HIGHEST, HIGH, MEDIUM, LOW, LOWEST       |
| status      | TodoStatus     | No       | ACTIVE     | One of ACTIVE, COMPLETED                        |
| createdAt   | DateTime       | No       | now()      | Immutable after creation                        |
| updatedAt   | DateTime       | No       | @updatedAt | Auto-updated by Prisma on every write           |

**Relations**:
- `Todo` belongs to exactly one `User` (many-to-one)
- `User` has many `Todo` records (one-to-many)
- No relation to `Block` — cross-domain bridge is a one-time copy at promotion time

**Indexes**:
- `(userId)` — primary list query by owner
- `(userId, status)` — filtered list query (the most common read pattern)

---

## Existing Model Changes: None

The `Block` model and all existing models remain unchanged. No foreign key is added between `Todo` and `Block`.

---

## Prisma Schema Addition

```prisma
enum TodoPriority {
  HIGHEST
  HIGH
  MEDIUM
  LOW
  LOWEST
}

enum TodoStatus {
  ACTIVE
  COMPLETED
}

model Todo {
  id          String       @id @default(uuid()) @db.Uuid
  userId      String       @db.Uuid
  user        User         @relation("UserTodos", fields: [userId], references: [id], onDelete: Cascade)

  title       String
  description String?
  priority    TodoPriority @default(MEDIUM)
  status      TodoStatus   @default(ACTIVE)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([userId])
  @@index([userId, status])
}
```

The `User` model gains the back-relation:

```prisma
todos Todo[] @relation("UserTodos")
```

---

## State Transitions

### TodoStatus

```
  [creation]
      │
      ▼
   ACTIVE ◄──────────────────┐
      │                       │
      │  (mark completed)     │  (mark active again)
      ▼                       │
  COMPLETED ─────────────────┘
```

Both transitions are always permitted by the API (no irreversible terminal state at MVP).

### TodoPriority

Priority is not a state machine — it can be freely updated to any of the five values at any time.

---

## Validation Rules (enforced at API layer)

| Field       | Rule                                                          |
|-------------|---------------------------------------------------------------|
| title       | Required. Must be a non-empty string. (`@IsString @MinLength(1)`) |
| description | Optional. Must be a string if provided. (`@IsOptional @IsString`) |
| priority    | Optional on creation (defaults to MEDIUM). Must be a valid `TodoPriority` enum value if provided. (`@IsOptional @IsEnum(TodoPriority)`) |
| status      | Optional on creation (defaults to ACTIVE). Must be a valid `TodoStatus` enum value if provided on update. (`@IsOptional @IsEnum(TodoStatus)`) |
