# Tasks: Todo API with Block Promotion

**Input**: Design documents from `/specs/006-todo-api/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the module directory skeleton before any code is written.

- [x] T001 Create directory `apps/api/src/todo/dto/` (empty, to be populated by later tasks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema changes + module wiring that ALL user stories depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete these in order — migration must run after schema is updated.

- [x] T002 Add `TodoPriority` enum (`HIGHEST HIGH MEDIUM LOW LOWEST`), `TodoStatus` enum (`ACTIVE COMPLETED`), `Todo` model (id, userId, title, description?, priority default MEDIUM, status default ACTIVE, createdAt, updatedAt with indexes on `[userId]` and `[userId, status]`), and `todos Todo[] @relation("UserTodos")` back-relation on `User` in `apps/api/prisma/schema.prisma`
- [x] T003 Run `cd apps/api && yarn prisma migrate dev --name add-todo-model` to apply schema and regenerate Prisma client (depends on T002)
- [x] T004 Create `apps/api/src/todo/todo.module.ts` declaring `TodoController` in controllers and `TodoService` in providers with no additional imports (PrismaModule is global)
- [x] T005 Import and add `TodoModule` to the `imports` array in `apps/api/src/app.module.ts` (depends on T004)
- [x] T006 Add `.addTag('todos', 'CRUD operations and block promotion for user-owned todo tasks')` to the Swagger `DocumentBuilder` chain in `apps/api/src/main.ts`

**Checkpoint**: Foundation ready — Prisma client has `Todo`, `TodoPriority`, `TodoStatus` types; module is wired; Swagger tag is registered.

---

## Phase 3: User Story 1 — Task CRUD Operations (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can create, list, read, update, and delete their own todo tasks via REST endpoints. Privacy is enforced — users see only their own todos.

**Independent Test**: Call `POST /todos` to create a task, `GET /todos` to list it, `PATCH /todos/:id` to update title/description, `DELETE /todos/:id` to remove it. Verify another user's token cannot read or modify the task (expect 404).

- [x] T007 [P] [US1] Create `apps/api/src/todo/dto/todo-response.dto.ts` with `@ApiProperty()` decorated fields: `id`, `userId`, `title`, `description` (nullable), `priority` (`TodoPriority` enum), `status` (`TodoStatus` enum), `createdAt`, `updatedAt`
- [x] T008 [P] [US1] Create `apps/api/src/todo/dto/create-todo.dto.ts` with `title: string` (`@IsString() @MinLength(1)`), `description?: string` (`@IsOptional() @IsString()`), `priority?: TodoPriority` (`@IsOptional() @IsEnum(TodoPriority)`) — all with `@ApiProperty()` / `@ApiPropertyOptional()` decorators
- [x] T009 [US1] Create `apps/api/src/todo/dto/update-todo.dto.ts` extending `PartialType(CreateTodoDto)` from `@nestjs/swagger` and adding `status?: TodoStatus` (`@IsOptional() @IsEnum(TodoStatus) @ApiPropertyOptional()`) (depends on T008)
- [x] T010 [US1] Implement `apps/api/src/todo/todo.service.ts` with `findAll(userId: string)`, `findOne(id: string, userId: string)` (throws `NotFoundException('Todo not found')` when missing), `create(userId: string, dto: CreateTodoDto)`, `update(id: string, userId: string, dto: UpdateTodoDto)` (calls findOne for ownership), `remove(id: string, userId: string)` (hard delete via `db.todo.delete`, calls findOne first) — all scoped to userId via `where: { id, userId }` (depends on T007, T008, T009)
- [x] T011 [US1] Implement `apps/api/src/todo/todo.controller.ts` with `@ApiTags('todos') @ApiBearerAuth('access-token') @Controller('todos')` and five routes: `GET /todos` → `findAll`, `GET /todos/:id` → `findOne`, `POST /todos` → `create` (201), `PATCH /todos/:id` → `update`, `DELETE /todos/:id` → `remove`; each route decorated with `@ApiOperation`, `@ApiResponse` (200/201, 401, 404, 422) and `@ApiParam` where applicable; use `@CurrentUser() user: JwtPayload` for userId (depends on T010)
- [x] T012 [US1] Write `apps/api/src/todo/todo.service.spec.ts` with mocked `PrismaService` (`{ db: { todo: { findMany, findFirst, create, update, delete: jest.fn() }, block: { findFirst: jest.fn() } } }`) covering: `findAll` returns user-scoped results, `findOne` throws NotFoundException for missing/other-user todo, `create` persists with correct userId, `update` applies partial fields after ownership check, `remove` hard-deletes after ownership check
- [x] T013 [P] [US1] Write `apps/api/src/todo/todo.controller.spec.ts` with mocked `TodoService` covering: each route delegates to the correct service method with the correct arguments from `@CurrentUser()` and route params/body

**Checkpoint**: User Story 1 complete — full CRUD works, user isolation enforced, unit tests pass.

---

## Phase 4: User Story 2 — Priority & Status Filtering (Priority: P2)

**Goal**: Authenticated users can filter their task list by status (`ACTIVE` or `COMPLETED`). Priority and status values are strictly validated by the API.

**Independent Test**: Create one `ACTIVE` and one `COMPLETED` todo. Call `GET /todos?status=ACTIVE` and verify only the active one is returned. Call `GET /todos?status=COMPLETED` and verify only the completed one. Attempt to create a todo with `"priority": "URGENT"` and verify a 422 validation error is returned.

- [x] T014 [US2] Create `apps/api/src/todo/dto/todo-filter.dto.ts` with `status?: TodoStatus` (`@IsOptional() @IsEnum(TodoStatus) @ApiPropertyOptional({ enum: TodoStatus, enumName: 'TodoStatus' })`)
- [x] T015 [US2] Update `TodoService.findAll()` signature in `apps/api/src/todo/todo.service.ts` to accept `status?: TodoStatus` as second parameter and conditionally add `status` to the Prisma `where` clause: `where: { userId, ...(status && { status }) }`
- [x] T016 [US2] Update the `GET /todos` handler in `apps/api/src/todo/todo.controller.ts` to inject `@Query() filter: TodoFilterDto` and pass `filter.status` to `todoService.findAll(user.sub, filter.status)`; add `@ApiQuery({ name: 'status', enum: TodoStatus, required: false })` decorator (depends on T014, T015)
- [x] T017 [US2] Extend `apps/api/src/todo/todo.service.spec.ts` with status-filter test cases: `findAll` with `status: TodoStatus.ACTIVE` passes `{ userId, status: ACTIVE }` to Prisma; `findAll` without status passes `{ userId }` only (no status key)

**Checkpoint**: User Story 2 complete — status filter works, enum validation rejects invalid values, unit tests pass.

---

## Phase 5: User Story 3 — Block-to-Task Promotion (Priority: P3)

**Goal**: Authenticated users can trigger a one-time promotion of a `TASK`-type block into an independent todo. The block is not modified. Promoting the same block again creates a second independent todo.

**Independent Test**: Create a block with `type: TASK`. Call `POST /todos/from-block/:blockId`. Verify a new todo exists in `GET /todos` with the block's title, `ACTIVE` status, and `MEDIUM` priority. Verify the block is unchanged via `GET /blocks/:id`. Call promote again — verify a second distinct todo is created. Attempt with a non-TASK block — verify 400 error.

- [x] T018 [US3] Create `apps/api/src/todo/dto/promote-block.dto.ts` with `priority?: TodoPriority` (`@IsOptional() @IsEnum(TodoPriority) @ApiPropertyOptional({ enum: TodoPriority, enumName: 'TodoPriority' })`)
- [x] T019 [US3] Implement `TodoService.promoteBlock(blockId: string, userId: string, priority?: TodoPriority)` in `apps/api/src/todo/todo.service.ts`: query `db.block.findFirst({ where: { id: blockId, userId, status: { not: BlockStatus.DELETED } } })`, throw `NotFoundException('Block not found')` if null, throw `BadRequestException('Block type must be TASK to promote')` if `block.type !== BlockType.TASK`, then `db.todo.create({ data: { userId, title: block.title, priority: priority ?? TodoPriority.MEDIUM } })` and return the new todo
- [x] T020 [US3] Add `POST /todos/from-block/:blockId` route **as the first route declared in the class body** (before `GET /todos/:id`) in `apps/api/src/todo/todo.controller.ts`: handler signature `promoteBlock(@Param('blockId') blockId: string, @CurrentUser() user: JwtPayload, @Body() dto: PromoteBlockDto)`, returns 201, decorated with `@ApiOperation`, `@ApiParam({ name: 'blockId' })`, `@ApiResponse(201)`, `@ApiResponse(400)`, `@ApiResponse(404)` (depends on T018, T019)
- [x] T021 [US3] Extend `apps/api/src/todo/todo.service.spec.ts` with `promoteBlock` test cases: creates todo from block.title with MEDIUM default priority; uses provided priority override; throws NotFoundException when block not found; throws BadRequestException when block.type is not TASK; block.findFirst called with `{ id: blockId, userId, status: { not: DELETED } }`

**Checkpoint**: User Story 3 complete — block promotion works end-to-end, block unchanged, error cases handled, unit tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation alignment.

- [x] T022 Verify all 6 endpoints appear under the `todos` tag in Swagger UI at `http://localhost:3000/api/docs` and execute the smoke-test curl commands from `specs/006-todo-api/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 — can start once Prisma types are available
- **Phase 4 (US2)**: Depends on Phase 3 — extends `findAll` and controller; tests extend `todo.service.spec.ts`
- **Phase 5 (US3)**: Depends on Phase 2 — `promoteBlock` only needs the Prisma `Todo` model; it is otherwise independent of US1/US2 code (but shares `todo.service.ts` file, so work sequentially in practice)
- **Phase 6 (Polish)**: Depends on all prior phases complete

### Within Phase 3 (US1)

```
T007, T008 (parallel, different files)
    → T009 (depends on T008)
        → T010 (depends on T007, T008, T009)
            → T011, T012 (T011 depends on T010; T012 depends on T010)
T013 (parallel with T012 — different file)
```

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 foundation — no dependency on US2 or US3
- **US2 (P2)**: Extends US1's service and controller; shares `todo.service.spec.ts`; implement after US1
- **US3 (P3)**: Shares `todo.service.ts` and `todo.service.spec.ts` with US1; implement after US1

### Parallel Opportunities

Within Phase 2: T004 and T006 can run in parallel (different files) after T003 completes.
Within Phase 3: T007 and T008 in parallel → T009 → T010 → T011 and T012+T013 in parallel.
Within Phase 5: T018 and T019 can be written in parallel (different files); T020 depends on both.

---

## Parallel Example: Phase 3 (User Story 1)

```
# Start these two in parallel:
Task T007: "Create todo-response.dto.ts in apps/api/src/todo/dto/"
Task T008: "Create create-todo.dto.ts in apps/api/src/todo/dto/"

# Then T009 (needs T008):
Task T009: "Create update-todo.dto.ts in apps/api/src/todo/dto/"

# Then T010 (needs T007, T008, T009):
Task T010: "Implement todo.service.ts"

# Then start these in parallel:
Task T011: "Implement todo.controller.ts"
Task T012: "Write todo.service.spec.ts"
Task T013: "Write todo.controller.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002 → T003 → T004, T005, T006)
3. Complete Phase 3: User Story 1 (T007–T013)
4. **STOP and VALIDATE**: `GET /todos`, `POST /todos`, `PATCH /todos/:id`, `DELETE /todos/:id` all work; another user's token gets 404
5. Ship MVP

### Incremental Delivery

1. Foundation (Phase 1 + 2) → types available
2. US1 (Phase 3) → working CRUD todo list ← **MVP delivery point**
3. US2 (Phase 4) → adds status filtering and strict validation demo
4. US3 (Phase 5) → adds block promotion (productivity loop)
5. Polish (Phase 6) → Swagger verified

### Task Count Summary

| Phase | Tasks | Parallelizable |
|-------|-------|---------------|
| Phase 1: Setup | 1 | 0 |
| Phase 2: Foundational | 5 | 2 (T004, T006 after T003) |
| Phase 3: US1 CRUD | 7 | 4 (T007, T008, T012, T013) |
| Phase 4: US2 Filtering | 4 | 0 |
| Phase 5: US3 Promotion | 4 | 2 (T018, T019) |
| Phase 6: Polish | 1 | 0 |
| **Total** | **22** | **8** |

---

## Notes

- [P] tasks operate on different files and have no incomplete dependencies — safe to parallelize
- US2 and US3 both modify `todo.service.ts` — work sequentially to avoid merge conflicts
- `from-block/:blockId` route MUST be declared before `/:id` in controller class body (NestJS routing)
- Hard delete (not soft) for todos — unlike blocks, todos have no archive state
- No pagination at MVP — constitution Principle III (Simplicity Over Features)
- Commit after each task or logical group for clean history
