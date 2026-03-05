# Research: Todo API with Block Promotion

**Feature**: 006-todo-api
**Date**: 2026-03-05

---

## Decision 1: Module placement for the promotion endpoint

**Decision**: The block-promotion action lives on `POST /todos/from-block/:blockId` inside the `TodoModule`, not on the `BlockController`.

**Rationale**: The action's outcome is creating a `Todo`. Placing it in `TodoController` keeps the `BlockModule` unchanged (constitution Principle I — Blocks Are Atomic) and routes the cross-domain call through the domain that owns the created entity. The `TodoService` reads the block via `PrismaService` directly (not via `BlockService`) to avoid introducing an inter-module dependency — consistent with how `NoteService` and `StorageService` both access Prisma directly.

**Alternatives considered**:
- `POST /blocks/:id/promote` on `BlockController` — rejected because it adds todo-creation logic to the block domain and creates coupling.
- Injecting `BlockService` into `TodoService` — rejected because it crosses module boundaries unnecessarily; reading the block record directly via the shared `PrismaService` is simpler and already established as the project pattern.

---

## Decision 2: Priority and Status as Prisma enums

**Decision**: Define `TodoPriority` (HIGHEST, HIGH, MEDIUM, LOW, LOWEST) and `TodoStatus` (ACTIVE, COMPLETED) as Prisma enums in `schema.prisma`, mirroring the existing `BlockType`, `BlockStatus`, and `BlockVisibility` enums.

**Rationale**: Enum values are validated at the database layer (no invalid strings persist) and Prisma generates TypeScript types that class-validator `@IsEnum()` can reference — exactly the same pattern used by the Block module. This satisfies constitution Principle V (Type-Safe and Test-Driven) with zero custom validation logic.

**Alternatives considered**:
- Plain strings with `@IsIn([...])` validation — rejected; no DB-level enforcement, more fragile.
- Separate `priority` as an integer (1–5) — rejected; less expressive in API and requires a custom transform layer.

---

## Decision 3: Task title length constraint

**Decision**: Title is required (`@MinLength(1)`) with no explicit max length enforced by class-validator (PostgreSQL `TEXT` type has no practical upper bound). The spec documents 500-char max as an assumption, but enforcing it in the DTO adds friction with zero current user benefit. Can be added post-MVP.

**Rationale**: Existing `Block.title` has no length constraint either. Consistency within the project avoids one-off special-casing.

**Alternatives considered**:
- `@MaxLength(500)` — available if needed, deferred per constitution Principle III (Simplicity Over Features).

---

## Decision 4: List filtering via query parameter

**Decision**: `GET /todos` accepts an optional `?status=ACTIVE|COMPLETED` query parameter. If absent, all tasks are returned. No pagination in MVP.

**Rationale**: Constitution Principle IV (Performance is a Feature) notes pagination is required — but for a personal todo list with realistically small record counts the performance risk is negligible at MVP scale. Pagination is deferred per Principle III. The status filter is the highest-value filter per the spec acceptance scenarios.

**Alternatives considered**:
- Always return all and filter on frontend — acceptable but wastes bandwidth for large lists; a simple query param is costless to add now.
- Full filtering by priority — deferred; not requested in the spec.

---

## Decision 5: No persistent link between Block and promoted Todo

**Decision**: The promotion endpoint creates an independent `Todo` record with no foreign key back to the source `Block`.

**Rationale**: Constitution Principle VIII explicitly states "the Tasks domain MUST otherwise maintain its own data model and API, decoupled from Blocks". A foreign key would entangle the two domains and create a cascade-delete dependency. The spec edge case confirms: deleting the block must not affect the task.

**Alternatives considered**:
- Store `sourceBlockId` as nullable on `Todo` — tempting for future traceability but adds complexity, violates Principle VIII's decoupling directive, and is not required by any acceptance scenario. Deferred.

---

## Decision 6: Default priority on promotion

**Decision**: When the promotion endpoint is called without a priority override, the created Todo defaults to `MEDIUM` — consistent with `POST /todos` creation default.

**Rationale**: Spec FR-013 and acceptance scenario 1 both specify `Medium` as the default. Consistency between the two creation paths prevents user confusion.
