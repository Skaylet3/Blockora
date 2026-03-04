# Research: Notes & Storage API

**Feature**: 004-notes-storage-api | **Date**: 2026-03-04

---

## Decision 1: Self-Referential Storage Hierarchy in Prisma

**Decision**: Use a single `Storage` model with a nullable self-referential `parentId` foreign key and a named relation (`"StorageChildren"`). Set `onDelete: Cascade` on the parent relation so PostgreSQL handles recursive deletion natively.

**Rationale**: Prisma 7 supports self-referential relations with named relations. Setting `onDelete: Cascade` at the database level ensures that deleting a root storage automatically removes all descendant storages recursively without any application-level traversal logic, which matches FR-003 cleanly and avoids N+1 recursive delete calls.

**Alternatives considered**:
- Application-level recursive delete (traverse tree manually, delete leaves first): More complex code, more DB round-trips, risk of partial deletion if an error occurs mid-traversal. Rejected.
- Separate "folder path" / materialized path pattern: Simpler reads, complex writes. Overkill for the MVP where tree depth is unlimited but volumes are small. Rejected.

---

## Decision 2: Note Model with Dual Ownership Fields (userId + storageId)

**Decision**: The `Note` model stores both `userId` (direct owner reference) and `storageId` (container reference). Ownership is always validated against `userId` directly — the service never trusts `storageId` alone for authorization.

**Rationale**: Querying notes by `userId` for authorization and by `storageId` for listing are both common operations. Having both fields with indexes avoids joining through Storage to check ownership, keeping note queries fast and straightforward. This matches the existing Block pattern (all queries include a `userId` filter).

**Alternatives considered**:
- Derive ownership from storage's userId via a join: More complex queries, slower. Rejected.
- Use only `storageId` and join: Requires a join on every ownership check. Rejected.

---

## Decision 3: Module Structure — Two Separate NestJS Modules

**Decision**: Create two NestJS modules: `StorageModule` and `NoteModule`, following the exact same pattern as `BlockModule`. Each module has its own service, controller, and DTOs directory.

**Rationale**: Storages and Notes are distinct domain entities with different lifecycle rules (cascade delete on storage) and different CRUD shapes. Keeping them in separate modules maintains clean separation of concerns and allows each to evolve independently, consistent with Principle VI (Monorepo Discipline) and the existing codebase pattern.

**Alternatives considered**:
- Single `NotesModule` containing both: Simpler initially, but couples lifecycle logic. Rejected.
- Nested controller routing (`/storages/:id/notes`): Valid REST pattern, but the frontend uses flat data structures. Flat routes (`/storages`, `/notes`) are simpler and sufficient. Rejected.

---

## Decision 4: Note Listing — Query Parameter on Flat Notes Route

**Decision**: `GET /notes?storageId={id}` — flat route with optional `storageId` query parameter. Without the parameter, list all notes for the authenticated user.

**Rationale**: The frontend tree view needs notes per storage; the graph view may eventually need all notes. A single flat endpoint with an optional filter serves both use cases without route proliferation. Consistent with how blocks use `GET /blocks` (flat list).

**Alternatives considered**:
- `GET /storages/:id/notes` (nested resource route): Tighter coupling, cannot list all notes without extra endpoint. Rejected.
- Separate endpoints: `GET /storages/:id/notes` + `GET /notes`: Two routes to maintain. Rejected.

---

## Decision 5: Test Coverage Strategy

**Decision**: Three-layer testing matching the existing project pattern:
1. **Unit tests** (Vitest, `*.spec.ts`): Mock PrismaService, test service and controller logic in isolation.
2. **Integration tests** (Vitest, `*.int-spec.ts`): Real services + real test DB via `bootstrapIntegrationServices()`, verify ownership boundaries, cascade delete, and DB state.
3. **E2E tests** (Playwright, `*.e2e-spec.ts`): Real HTTP calls via `bootstrapE2eClient()`, cover full CRUD flows + auth rejection.

**Rationale**: Exactly mirrors the existing block, auth, and users test structure. Unit tests catch logic errors fast; integration tests confirm DB behavior (cascade delete is DB-level, only integration tests can verify it); E2E tests confirm the HTTP contract.

**Alternatives considered**:
- Unit + E2E only (skip integration): Would miss cascade delete verification. Rejected.
- E2E only: Slow feedback, harder to isolate failures. Rejected.

---

## Decision 6: No Storage Rename in This Feature

**Decision**: Storage update (rename) is deferred — only create, list, and delete are implemented for Storages in this feature.

**Rationale**: The frontend notes page does not currently expose a rename UI. The spec explicitly deferred this. Adding it now would violate Principle III (Simplicity Over Features / YAGNI).

**Alternatives considered**:
- Add `PATCH /storages/:id` alongside other storage endpoints: Tempting, but not in scope. Deferred to a future iteration.

---

## Decision 7: Migration Strategy

**Decision**: Create a new Prisma migration file for the `Storage` and `Note` models. The migration adds two new tables with indexes and the self-referential cascade constraint on `Storage`.

**Rationale**: The constitution (§ Development Workflow, rule 6) mandates migration files for all schema changes. Direct schema mutations are prohibited.

**Alternatives considered**:
- Raw SQL in `manual-sql/`: Only appropriate for things Prisma cannot express. Full model definitions belong in Prisma migrations. Rejected.
