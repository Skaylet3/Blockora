---

description: "Task list for User Profile Update feature"
---

# Tasks: User Profile Update

**Input**: Design documents from `specs/003-profile-update/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in specification — no test tasks included.

**Organization**: Phase 2 (Foundational) covers all backend work that must be complete before
the frontend (Phase 3 / US1) can be functionally tested. US2 (Extensible Profile Fields) is a
design constraint baked into US1's implementation — partial-update DTO and selective DB write
satisfy it by construction.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: US1 = Edit Display Name / US2 = Extensible Profile Fields (constraint on US1)
- Paths are absolute from monorepo root

---

## Phase 1: Setup

**Purpose**: Confirm no external setup work is needed before implementation begins.

- [x] T001 Verify that `displayName String?` exists in `apps/api/prisma/schema.prisma` (no migration required) and that `class-validator`, `class-transformer`, and `@nestjs/swagger` are listed in `apps/api/package.json` dependencies

**Checkpoint**: No new packages, no new migration — implementation can begin immediately.

---

## Phase 2: Foundational — Backend UsersModule & Auth Updates

**Purpose**: Build the `UsersModule` and update `AuthController.me()` to return `displayName`.
All frontend US1 tasks are blocked until this phase is complete.

**⚠️ CRITICAL**: No frontend work can begin until T002–T010 are complete.

- [x] T002 [P] Create `apps/api/src/users/dto/profile-response.dto.ts` — export `ProfileResponseDto` class with three `@ApiProperty`-decorated fields: `userId: string`, `email: string`, and `@ApiPropertyOptional() displayName: string | null`
- [x] T003 [P] Create `apps/api/src/users/dto/update-profile.dto.ts` — export `UpdateProfileDto` class with a single optional field: `@IsOptional() @IsString() @MaxLength(100) @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value) displayName?: string`
- [x] T004 Create `apps/api/src/users/users.service.ts` — `@Injectable()` class with `PrismaService` injected; implement `getProfile(userId: string): Promise<ProfileResponseDto>` (fetch user by `id`, map to `ProfileResponseDto`) and `updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto>` (partial Prisma update using only defined fields from `dto`, trim and null-coerce `displayName`, return updated profile) (depends on T002, T003)
- [x] T005 Create `apps/api/src/users/users.controller.ts` — `@ApiTags('users') @ApiBearerAuth('access-token') @Controller('users')` class; add `@Patch('me')` handler with `@ApiOperation`, `@ApiBody({ type: UpdateProfileDto })`, `@ApiResponse({ status: 200, type: ProfileResponseDto })`, `@ApiResponse({ status: 401 })`, `@ApiResponse({ status: 422 })` decorators; handler signature: `updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto)` calling `this.usersService.updateProfile(user.sub, dto)` (depends on T004)
- [x] T006 Create `apps/api/src/users/users.module.ts` — `@Module({ controllers: [UsersController], providers: [UsersService], exports: [UsersService] })` (note: `PrismaModule` is global — no import needed); (depends on T004, T005)
- [x] T007 Update `apps/api/src/app.module.ts` — add `UsersModule` to the `imports` array alongside `BlockModule` and `AuthModule` (depends on T006)
- [x] T008 [P] Update `apps/api/src/auth/dto/me-response.dto.ts` — add `@ApiPropertyOptional({ description: 'User display name, null if not set', example: 'Alice' }) displayName: string | null` as a third field (alongside existing `userId` and `email`)
- [x] T009 Update `apps/api/src/auth/auth.module.ts` — add `UsersModule` to the `imports` array so `UsersService` is available for injection into `AuthController` (depends on T006)
- [x] T010 Update `apps/api/src/auth/auth.controller.ts` — inject `UsersService` as a second constructor parameter; change the `me()` method to `async me(...): Promise<MeResponseDto>`; replace the current `return { userId: user.sub, email: user.email }` body with `return this.usersService.getProfile(user.sub)` (return value shape matches `MeResponseDto` after T008); update the `@ApiResponse` description to "Returns userId, email, and displayName of the authenticated user" (depends on T008, T009)

**Checkpoint**: Backend is fully functional — `GET /auth/me` returns `displayName`, `PATCH /users/me` applies partial updates. Verify with `curl` steps 1–6 in `quickstart.md`.

---

## Phase 3: User Story 1 — Edit Display Name (Priority: P1) 🎯 MVP

**Goal**: Wire the existing Profile Settings UI to the new backend endpoints — add the Name
field, make Save functional, and make Cancel restore the last saved value.

**Independent Test**: Log in, navigate to `/profile`, type a name in the Name field, click
Save, reload the page — the saved name is shown pre-populated.

### Implementation for User Story 1

- [x] T011 [P] [US1] Update `apps/web/src/shared/api/auth.api.ts` — (a) add `displayName?: string | null` to the `User` interface; (b) add `export interface UpdateProfileBody { displayName?: string }` below the existing interfaces; (c) add `updateProfile(body: UpdateProfileBody): Promise<User>` method to the `authApi` object calling `request<User>('/users/me', { method: 'PATCH', body })`
- [x] T012 [P] [US1] Update profile page props threading — (a) in `apps/web/src/pages-flat/profile/ui/profile-page.tsx`: add `initialDisplayName: string` to `ProfilePageProps` and pass it as `<ProfileForm ... initialDisplayName={initialDisplayName} />`; (b) in `apps/web/src/app/profile/page.tsx`: pass `initialDisplayName=''` to `<ProfilePage>` (access token is in localStorage, client-side fetch fills the actual value)
- [x] T013 [US1] Update `apps/web/src/features/update-profile/ui/profile-form.tsx` — (a) add `initialDisplayName: string` to `ProfileFormProps`; (b) add `const [displayName, setDisplayName] = React.useState(initialDisplayName)` and `const [savedDisplayName, setSavedDisplayName] = React.useState(initialDisplayName)`; (c) in the existing `useEffect` that calls `authApi.getMe()`, set `displayName` and `savedDisplayName` from `user.displayName ?? ''`; (d) add a `<div className="space-y-1.5">` block containing `<Label htmlFor="displayName">Name</Label>` and `<Input id="displayName" type="text" value={loading ? '' : displayName} onChange={e => setDisplayName(e.target.value)} placeholder={loading ? 'Loading...' : 'Your display name'} disabled={loading} />` inserted before the existing email field block; (e) replace `handleSave` body with an async function that calls `await authApi.updateProfile({ displayName: displayName.trim() || undefined })`, updates `savedDisplayName` on success, and shows `toast.success('Profile saved.')` on success or `toast.error(err.messages?.[0] ?? 'Failed to save.')` on failure; (f) replace `handleCancel` body with `setDisplayName(savedDisplayName)` and `toast.info('Changes discarded.')` (depends on T011, T012)

**Checkpoint**: Full end-to-end user story works — save persists, cancel reverts, reload shows saved name, error case shows toast. Verify with `quickstart.md` steps 7–8.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup.

- [x] T014 Run `quickstart.md` validation steps 1–8 end-to-end to confirm all acceptance scenarios from `spec.md` pass (whitespace trim, name too long → 422, clear name → null, cancel → revert, save → success toast, reload → pre-populated)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all frontend work
  - T002, T003, T008 can start immediately in parallel
  - T004 waits for T002 + T003
  - T005 waits for T004
  - T006 waits for T004 + T005
  - T007 waits for T006
  - T009 waits for T006
  - T010 waits for T008 + T009
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
  - T011, T012 can run in parallel once Phase 2 is done
  - T013 waits for T011 + T012
- **Polish (Phase 4)**: Depends on Phase 3 completion

### Within Phase 2 — Parallel Opportunities

```
Start together (no deps):   T002, T003, T008
After T002 + T003:          T004
After T004:                 T005
After T004 + T005:          T006
After T006:                 T007, T009
After T008 + T009:          T010
```

### Within Phase 3 — Parallel Opportunities

```
Start together (after Phase 2):   T011, T012
After T011 + T012:                T013
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational backend (T002–T010)
3. **STOP and verify backend**: `curl` steps 1–6 in `quickstart.md`
4. Complete Phase 3: Frontend (T011–T013)
5. **STOP and validate UI**: `quickstart.md` step 7
6. Complete Phase 4: Polish (T014)

### Parallel Team Strategy

With two developers:

1. Both complete Phase 1 together
2. **Developer A**: T002, T003 → T004 → T005 → T006 → T007, T009 → T010 (backend)
3. **Developer B**: T008 (can start immediately), then waits on T006 before T009 context
4. Once Phase 2 complete: **Developer A**: T011; **Developer B**: T012 → both unblock T013

---

## Notes

- `[P]` tasks operate on different files with no shared in-progress dependencies
- `[US1]` label maps to User Story 1 (Edit Display Name) in `spec.md`
- US2 (Extensible Profile Fields) is satisfied by the partial-update DTO and selective Prisma write in `UpdateProfileDto` + `UsersService.updateProfile()` — no additional tasks required
- `PrismaModule` is `@Global()` — `UsersModule` does NOT need to import it explicitly
- No Prisma migration: `displayName String?` already exists in `schema.prisma`
- The `Transform` decorator on `displayName` in `UpdateProfileDto` handles trimming server-side; the frontend also trims before sending (`displayName.trim() || undefined`)
