# Tasks: Notes & Storage API

**Input**: Design documents from `/specs/004-notes-storage-api/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api-contracts.md ✅

**Tests**: Included — FR-012 and Principle V (Type-Safe and Test-Driven) mandate tests for all new endpoints. All three layers are required: unit (Vitest `.spec.ts`), integration (Vitest `.int-spec.ts`), and E2E (Playwright `.e2e-spec.ts`).

**Organization**: Tasks grouped by user story. Stories are independently testable increments.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the module directory scaffolding. No new project init needed — extending existing NestJS app.

- [X] T001 Create directory `apps/api/src/storage/dto/` and `apps/api/src/note/dto/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema extension and migration. MUST complete before any user story can be implemented or tested against a real DB.

**⚠️ CRITICAL**: All unit tests can be written in parallel with this phase (they mock Prisma), but integration and E2E tests require the migration to be applied first.

- [X] T002 Add `Storage` model (self-referential with `parentId`, `onDelete: Cascade`) and `Note` model (FK to `Storage` with `onDelete: Cascade`) to `apps/api/prisma/schema.prisma`, following the target schema in `specs/004-notes-storage-api/data-model.md`. Also add back-relation fields (`storages`, `notes`) to the existing `User` model.
- [X] T003 Run `yarn prisma migrate dev --name add_storage_and_note` inside `apps/api/` to generate and apply the migration at `apps/api/prisma/migrations/<timestamp>_add_storage_and_note/migration.sql`

**Checkpoint**: Migration applied — integration and E2E tests can now run against the DB. Unit test authoring can start in parallel with T002/T003.

---

## Phase 3: User Story 1 — Manage Storages (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create root and nested Storages, list all their Storages (flat with `parentId`), and delete a Storage (cascading all descendants and their Notes). Zero data leaks between users.

**Independent Test**: Create two users, each creates storages with children; verify list is per-user; delete a parent and confirm all children and their notes are gone; attempt cross-user access and confirm 404.

### Unit Tests for User Story 1

> Write tests FIRST — they should FAIL until implementation tasks are complete.

- [X] T004 [P] [US1] Create unit tests for `StorageService` in `apps/api/src/storage/storage.service.spec.ts` — cover: `create` (root and nested), `findAll` (scoped to userId), `remove` (calls prisma delete with correct userId). Mock `PrismaService` with `{ db: { storage: { create: vi.fn(), findMany: vi.fn(), delete: vi.fn() } } }`.
- [X] T005 [P] [US1] Create unit tests for `StorageController` in `apps/api/src/storage/storage.controller.spec.ts` — verify each route delegates to `StorageService` with the correct `userId` from `@CurrentUser()`. Mock `StorageService`.

### Integration Tests for User Story 1

- [X] T006 [P] [US1] Create integration tests in `apps/api/test/integration/storage.service.int-spec.ts` using `bootstrapIntegrationServices()` — cover: create root storage, create child storage, list returns only current user's storages, delete cascades to children and notes (verify via prisma.db), cross-user access returns NotFoundException.

### E2E Tests for User Story 1

- [X] T007 [P] [US1] Create E2E tests in `apps/api/test/e2e/storages.e2e-spec.ts` using `bootstrapE2eClient()` — cover: `POST /storages` (201 with body), `GET /storages` (200 array), `DELETE /storages/:id` (204), unauthenticated request (401), cross-user delete (404), validation error on empty name (422).

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `apps/api/src/storage/dto/create-storage.dto.ts` — `CreateStorageDto` with `@IsString() @MinLength(1) name: string` and `@IsOptional() @IsUUID() parentId?: string`. Add `@ApiProperty` decorators.
- [X] T009 [P] [US1] Create `apps/api/src/storage/dto/storage-response.dto.ts` — `StorageResponseDto` with fields: `id`, `name`, `parentId` (nullable string), `createdAt`, `updatedAt`. Add `@ApiProperty` decorators.
- [X] T010 [US1] Create `apps/api/src/storage/storage.service.ts` — `StorageService` with:
  - `create(userId: string, dto: CreateStorageDto)`: if `parentId` provided, verify it exists and belongs to `userId` (throw `NotFoundException` if not), then `prisma.db.storage.create(...)`.
  - `findAll(userId: string)`: `prisma.db.storage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })`.
  - `remove(userId: string, id: string)`: verify ownership via `findMany` with `{ where: { id, userId } }` (throw `NotFoundException` if not found), then `prisma.db.storage.delete({ where: { id } })` — DB cascade handles children.
- [X] T011 [US1] Create `apps/api/src/storage/storage.controller.ts` — `StorageController` with `@ApiTags('storages')` and `@ApiBearerAuth('access-token')`:
  - `POST /storages` → `create(@CurrentUser() user, @Body() dto)` → 201
  - `GET /storages` → `findAll(@CurrentUser() user)` → 200
  - `DELETE /storages/:id` → `remove(@CurrentUser() user, @Param('id') id)` → 204 `@HttpCode(204)`
  - Add `@ApiOperation`, `@ApiResponse` decorators matching contracts.
- [X] T012 [US1] Create `apps/api/src/storage/storage.module.ts` — `StorageModule` with `controllers: [StorageController]` and `providers: [StorageService]`.
- [X] T013 [US1] Register `StorageModule` in `apps/api/src/app.module.ts` — add to `imports` array.

**Checkpoint**: `GET /storages`, `POST /storages`, `DELETE /storages/:id` fully functional. All unit, integration, and E2E tests for US1 pass.

---

## Phase 4: User Story 2 — Manage Notes Within a Storage (Priority: P2)

**Goal**: Authenticated users can create Notes (with title and content) inside a Storage they own, list notes per storage (or all notes), fetch a single note, update title/content, and delete notes. Cross-user access returns 404.

**Independent Test**: Create a user with a storage, perform full CRUD cycle on notes; verify list filters by `storageId`; attempt cross-user note access and confirm 404; confirm hard delete removes the note.

### Unit Tests for User Story 2

> Write tests FIRST — they should FAIL until implementation tasks are complete.

- [X] T014 [P] [US2] Create unit tests for `NoteService` in `apps/api/src/note/note.service.spec.ts` — cover: `create` (validates storageId ownership), `findAll` (with and without `storageId` filter), `findOne` (ownership check), `update`, `remove`. Mock `PrismaService` with `{ db: { note: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() }, storage: { findFirst: vi.fn() } } }`.
- [X] T015 [P] [US2] Create unit tests for `NoteController` in `apps/api/src/note/note.controller.spec.ts` — verify each route delegates to `NoteService` with the correct `userId`. Mock `NoteService`.

### Integration Tests for User Story 2

- [X] T016 [P] [US2] Create integration tests in `apps/api/test/integration/note.service.int-spec.ts` using `bootstrapIntegrationServices()` — cover: create note, list notes by storageId, get single note, update note, delete note, cross-user note access throws NotFoundException, create note in non-existent storage throws NotFoundException, create note in another user's storage throws NotFoundException.

### E2E Tests for User Story 2

- [X] T017 [P] [US2] Create E2E tests in `apps/api/test/e2e/notes.e2e-spec.ts` using `bootstrapE2eClient()` — cover: `POST /notes` (201), `GET /notes?storageId=` (200 array), `GET /notes` (all notes, 200), `GET /notes/:id` (200), `PATCH /notes/:id` (200), `DELETE /notes/:id` (204), unauthenticated (401), cross-user note access (404), empty title (422), invalid storageId (404).

### Implementation for User Story 2

- [X] T018 [P] [US2] Create `apps/api/src/note/dto/create-note.dto.ts` — `CreateNoteDto` with `@IsString() @MinLength(1) title: string`, `@IsOptional() @IsString() content?: string`, `@IsUUID() storageId: string`. Add `@ApiProperty` decorators.
- [X] T019 [P] [US2] Create `apps/api/src/note/dto/update-note.dto.ts` — `UpdateNoteDto extends PartialType(CreateNoteDto)` from `@nestjs/swagger`, omitting `storageId` (notes cannot be moved between storages). Explicitly re-declare only `title` and `content` as optional, or use `OmitType(CreateNoteDto, ['storageId'] as const)` then `PartialType`.
- [X] T020 [P] [US2] Create `apps/api/src/note/dto/note-response.dto.ts` — `NoteResponseDto` with fields: `id`, `title`, `content`, `storageId`, `createdAt`, `updatedAt`. Add `@ApiProperty` decorators.
- [X] T021 [US2] Create `apps/api/src/note/note.service.ts` — `NoteService` with:
  - `create(userId: string, dto: CreateNoteDto)`: verify `dto.storageId` belongs to `userId` via `prisma.db.storage.findFirst({ where: { id: dto.storageId, userId } })` (throw `NotFoundException` if null), then `prisma.db.note.create({ data: { ...dto, content: dto.content ?? '', userId } })`.
  - `findAll(userId: string, storageId?: string)`: `prisma.db.note.findMany({ where: { userId, ...(storageId ? { storageId } : {}) }, orderBy: { createdAt: 'desc' } })`.
  - `findOne(userId: string, id: string)`: `prisma.db.note.findFirst({ where: { id, userId } })` — throw `NotFoundException` if null.
  - `update(userId: string, id: string, dto: UpdateNoteDto)`: call `findOne` first (ownership check), then `prisma.db.note.update({ where: { id }, data: dto })`.
  - `remove(userId: string, id: string)`: call `findOne` first (ownership check), then `prisma.db.note.delete({ where: { id } })`.
- [X] T022 [US2] Create `apps/api/src/note/note.controller.ts` — `NoteController` with `@ApiTags('notes')` and `@ApiBearerAuth('access-token')`:
  - `POST /notes` → `create(@CurrentUser() user, @Body() dto)` → 201
  - `GET /notes` → `findAll(@CurrentUser() user, @Query('storageId') storageId?: string)` → 200
  - `GET /notes/:id` → `findOne(@CurrentUser() user, @Param('id') id)` → 200
  - `PATCH /notes/:id` → `update(@CurrentUser() user, @Param('id') id, @Body() dto)` → 200
  - `DELETE /notes/:id` → `remove(@CurrentUser() user, @Param('id') id)` → 204 `@HttpCode(204)`
  - Add `@ApiOperation`, `@ApiResponse`, `@ApiQuery` decorators matching contracts.
- [X] T023 [US2] Create `apps/api/src/note/note.module.ts` — `NoteModule` with `controllers: [NoteController]` and `providers: [NoteService]`.
- [X] T024 [US2] Register `NoteModule` in `apps/api/src/app.module.ts` — add to `imports` array alongside `StorageModule`.

**Checkpoint**: Full Note CRUD via HTTP is functional. All unit, integration, and E2E tests for US2 pass.

---

## Phase 5: User Story 3 — Full Storage Tree (Priority: P3)

**Goal**: The `GET /storages` endpoint (implemented in US1) already returns a flat list of all user storages with `parentId` references, satisfying US3 in full. This phase adds a specific multi-level hierarchy integration test to formally verify the tree reconstruction scenario.

**Independent Test**: Create a 3-level hierarchy (root → child → grandchild), call `GET /storages`, confirm the flat list contains all three nodes with correct `parentId` values.

- [X] T025 [US3] Add a `describe` block to `apps/api/test/integration/storage.service.int-spec.ts` covering the multi-level hierarchy scenario: create root → child → grandchild (3 levels), call `storageService.findAll(userId)`, assert all 3 items are returned with correct `parentId` relationships.
- [X] T026 [US3] Add a `test` block to `apps/api/test/e2e/storages.e2e-spec.ts` covering the full tree retrieval: create a 3-level hierarchy via `POST /storages`, call `GET /storages`, assert response contains all nodes with correct `parentId` values and is a flat array.

**Checkpoint**: US3 formally verified. The single `GET /storages` endpoint satisfies tree retrieval without additional implementation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Swagger documentation validation and full test suite run.

- [X] T027 [P] Verify Swagger docs at `http://localhost:3000/api/docs` show `storages` and `notes` tags with all 8 endpoints documented. Confirm request/response schemas match `contracts/api-contracts.md`. Fix any missing `@ApiResponse` or `@ApiProperty` decorators.
- [X] T028 Run full test suite from `apps/api/`: `yarn test` (unit), `yarn test:int` (integration), `yarn test:e2e` (E2E). Confirm all tests pass with zero failures. Fix any remaining issues.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS integration and E2E tests
- **Phase 3 (US1)**: Depends on Phase 2 — unit tests can be written in parallel with Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 — unit tests can be written in parallel with Phase 2; implementation depends on Phase 3 being registered in app.module.ts (T013)
- **Phase 5 (US3)**: Depends on Phase 3 (US1 implementation satisfies US3 contract)
- **Phase 6 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2. No dependency on other user stories.
- **US2 (P2)**: Depends on Phase 2 (migration). Implementation is independent of US1 except for `app.module.ts` registration. Note service depends on Storage existing in the DB (integration/E2E tests need US1's migration).
- **US3 (P3)**: Satisfied by US1 implementation. Only requires adding test cases to existing test files.

### Within Each User Story

- Unit tests (T004/T005, T014/T015) → can be written before implementation (TDD)
- Integration tests (T006, T016) → need migration applied (Phase 2 complete)
- E2E tests (T007, T017) → need API running with migration applied
- DTOs (T008/T009, T018/T019/T020) → before service and controller
- Service (T010, T021) → before controller
- Controller (T011, T022) → before module
- Module (T012, T023) → before app.module.ts registration

### Parallel Opportunities

All `[P]` tasks within a phase have no file conflicts and can be parallelized:
- T004 + T005 + T008 + T009 can all run simultaneously (different files)
- T006 + T007 can run simultaneously (after migration)
- T014 + T015 + T018 + T019 + T020 can all run simultaneously
- T016 + T017 can run simultaneously

---

## Parallel Example: User Story 1

```bash
# Write tests + DTOs in parallel (all different files):
Task T004: "Unit tests for StorageService in apps/api/src/storage/storage.service.spec.ts"
Task T005: "Unit tests for StorageController in apps/api/src/storage/storage.controller.spec.ts"
Task T008: "CreateStorageDto in apps/api/src/storage/dto/create-storage.dto.ts"
Task T009: "StorageResponseDto in apps/api/src/storage/dto/storage-response.dto.ts"

# After migration (T003) — run in parallel:
Task T006: "Integration tests in apps/api/test/integration/storage.service.int-spec.ts"
Task T007: "E2E tests in apps/api/test/e2e/storages.e2e-spec.ts"

# Sequential (DTOs → service → controller → module):
T008/T009 → T010 → T011 → T012 → T013
```

## Parallel Example: User Story 2

```bash
# Write tests + DTOs in parallel:
Task T014: "Unit tests for NoteService in apps/api/src/note/note.service.spec.ts"
Task T015: "Unit tests for NoteController in apps/api/src/note/note.controller.spec.ts"
Task T018: "CreateNoteDto in apps/api/src/note/dto/create-note.dto.ts"
Task T019: "UpdateNoteDto in apps/api/src/note/dto/update-note.dto.ts"
Task T020: "NoteResponseDto in apps/api/src/note/dto/note-response.dto.ts"

# After migration (T003) — run in parallel:
Task T016: "Integration tests in apps/api/test/integration/note.service.int-spec.ts"
Task T017: "E2E tests in apps/api/test/e2e/notes.e2e-spec.ts"

# Sequential (DTOs → service → controller → module):
T018/T019/T020 → T021 → T022 → T023 → T024
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Migration (T002, T003)
3. Write US1 tests (T004–T007 in parallel)
4. Implement US1 (T008–T013)
5. **STOP and VALIDATE**: Run `yarn test && yarn test:int && yarn test:e2e`
6. MVP: `GET /storages`, `POST /storages`, `DELETE /storages/:id` are live

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 complete → Storage CRUD live (MVP!)
3. US2 complete → Note CRUD live
4. US3 verified → Tree retrieval formally confirmed (no new code)
5. Polish → Full suite green

### Parallel Team Strategy

With two developers (after Phase 2 completes):

- Developer A: Phase 3 (US1 — Storages)
- Developer B: Phase 4 (US2 — Notes, unit tests writable before migration)

---

## Task Summary

| Phase | Tasks | Story | Parallel |
|-------|-------|-------|----------|
| Phase 1: Setup | T001 | — | — |
| Phase 2: Foundational | T002–T003 | — | — |
| Phase 3: US1 Storages | T004–T013 | US1 | T004, T005, T006, T007, T008, T009 |
| Phase 4: US2 Notes | T014–T024 | US2 | T014, T015, T016, T017, T018, T019, T020 |
| Phase 5: US3 Tree | T025–T026 | US3 | — |
| Phase 6: Polish | T027–T028 | — | T027 |
| **Total** | **28 tasks** | | **13 parallelizable** |

---

## Notes

- `[P]` tasks operate on different files — safe to parallelize
- `[Story]` label maps each task to its user story for full traceability
- Unit tests (`.spec.ts`) can be written before migration — they mock PrismaService
- Integration/E2E tests require migration applied (T003) before running
- Hard delete is used for both Storage and Note (unlike Block which uses `status: DELETED`)
- `DELETE /storages/:id` cascade is handled by PostgreSQL `ON DELETE CASCADE` — no application-level tree traversal needed
- Graph view (Obsidian-style) is explicitly out of scope for this feature (see spec.md Assumptions)
