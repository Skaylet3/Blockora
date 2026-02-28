# Tasks: Frontend–Backend API Integration

**Input**: Design documents from `/specs/001-frontend-api-integration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add environment configuration and create new directory structure before any coding begins.

- [x] T001 Add `NEXT_PUBLIC_API_BASE_URL=https://blockora-api.vercel.app/api` to `apps/web/.env.local` (create file if missing) and document it in `apps/web/.env.example`
- [x] T002 [P] Create directory `apps/web/src/shared/api/` (new FSD shared API layer)
- [x] T003 [P] Create directory `apps/web/src/features/edit-block/ui/` (new FSD feature slice)
- [x] T004 [P] Create directory `apps/web/src/features/delete-block/ui/` (new FSD feature slice)
- [x] T005 [P] Create directory `apps/web/src/pages-flat/register/ui/` (new register page slice)
- [x] T006 [P] Create directory `apps/web/src/app/register/` (new Next.js route)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — token storage, typed HTTP client, and API modules — that MUST be complete before any user story can be implemented. Also normalizes the Block entity types to match backend enums.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create `apps/web/src/shared/lib/token-storage.ts` with `getAccessToken()`, `getRefreshToken()`, `setTokens(pair: TokenPair)`, and `clearTokens()` using `localStorage` keys `blockora-access-token` / `blockora-refresh-token`; guard all reads with `typeof window !== 'undefined'` for SSR safety
- [x] T008 Create `apps/web/src/shared/api/http-client.ts` — typed `request<T>(path, options)` wrapper over native `fetch`: reads `process.env.NEXT_PUBLIC_API_BASE_URL` as base URL; attaches `Authorization: Bearer <accessToken>` for authenticated requests; on `401` calls `POST /auth/refresh` once then retries, or clears tokens + calls `router.push('/login')` on second failure; throws typed `ApiError` on non-2xx; supports `skipAuth: boolean` flag
- [x] T009 [P] Create `apps/web/src/shared/api/auth.api.ts` exporting `register(body)`, `login(body)`, `refresh(body)`, `logout()`, and `getMe()` — each calls the corresponding endpoint via `request<T>` with correct method, path, body, and `skipAuth` flag for public endpoints; export `TokenPair` and `User` types from this file
- [x] T010 [P] Create `apps/web/src/shared/api/blocks.api.ts` exporting `getBlocks()`, `getBlock(id)`, `createBlock(body)`, `updateBlock(id, body)`, and `deleteBlock(id)` — each calls the corresponding block endpoint via `request<T>`; all are authenticated (no `skipAuth`)
- [x] T011 Update `apps/web/src/entities/block/model/types.ts`: change `BlockType` to `'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA'`; add `BlockStatus` as `'ACTIVE' | 'ARCHIVED' | 'DELETED'`; add `BlockVisibility` as `'PRIVATE' | 'PUBLIC'`; update `Block` interface to add `userId: string`, `visibility: BlockVisibility`, `archivedAt: string | null` fields
- [x] T012 Update `apps/web/src/entities/user/model/types.ts`: add `User` interface `{ userId: string; email: string }`; export it via `apps/web/src/entities/user/index.ts`
- [x] T013 Update `apps/web/src/shared/lib/tag-colors.ts`: change `TYPE_COLORS` object keys from `Note/Task/Snippet/Idea` to `NOTE/TASK/SNIPPET/IDEA` to match updated `BlockType` enum
- [x] T014 Fix all downstream `BlockType`/`BlockStatus` references broken by T011: in `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx` change `activeTab` initial value from `'active'` to `'ACTIVE'`, update `BLOCK_TYPES` array values to uppercase, update `block.status` comparisons to uppercase; in `apps/web/src/entities/block/ui/block-card.tsx` add a display-label map (`NOTE → 'Note'`, `TASK → 'Task'`, etc.) for rendered text; in `apps/web/src/features/create-block/ui/create-block-dialog.tsx` update `TYPE_OPTIONS` values to uppercase; verify TypeScript compiles with no errors after these changes

**Checkpoint**: Run `cd apps/web && yarn tsc --noEmit` — must compile with zero errors before proceeding.

---

## Phase 3: User Story 1 — Register and Log In (Priority: P1) 🎯 MVP

**Goal**: Real register and login flows wired to the backend; session persists across refreshes; logout revokes server-side token.

**Independent Test**: Navigate to `/register`, create a new account → redirected to `/`. Reload the page → still on dashboard (session persists). Click logout → redirected to `/login`. Navigate back to `/login` with valid credentials → redirected to `/`.

- [x] T015 [US1] Update `apps/web/src/features/auth/ui/login-form.tsx`: replace the demo `document.cookie` assignment with a real call to `authApi.login({ email, password })`; on success call `tokenStorage.setTokens(pair)` then set `blockora-session=1` cookie and redirect to `/`; on `ApiError` extract `message` (string or string[]) and show it via `toast.error()`; remove the "Demo: Use any email and password" paragraph; add a link at the bottom "Don't have an account? Sign up" pointing to `/register`
- [x] T016 [P] [US1] Update `apps/web/src/features/auth/ui/logout-button.tsx`: before clearing the cookie, call `authApi.logout()` (fire-and-forget, no need to await for UX); after the call, call `tokenStorage.clearTokens()`, clear `blockora-session` cookie, then redirect to `/login`
- [x] T017 [US1] Create `apps/web/src/features/auth/ui/register-form.tsx`: visually identical layout to `login-form.tsx` (same container, logo, spacing); fields: email, password (min 8 chars client-side), optional display name; on submit call `authApi.register({ email, password, displayName })`; on success call `tokenStorage.setTokens(pair)`, set `blockora-session=1` cookie, redirect to `/`; on `ApiError` show `toast.error()` with extracted message (handle 409 duplicate email separately with a clear message); add a link "Already have an account? Sign in" → `/login`; export `RegisterForm` from the file
- [x] T018 [P] [US1] Update `apps/web/src/features/auth/index.ts` to also export `RegisterForm` from `./ui/register-form`
- [x] T019 [US1] Create `apps/web/src/pages-flat/register/ui/register-page.tsx` exporting `RegisterPage` — wraps `RegisterForm` in the same container pattern as `login-page.tsx`; create `apps/web/src/pages-flat/register/index.ts` that re-exports `RegisterPage`
- [x] T020 [US1] Create `apps/web/src/app/register/page.tsx`: server component; reads `blockora-session` cookie via `cookies()` from `next/headers`; if present calls `redirect('/')`; otherwise renders `<RegisterPage />`
- [x] T021 [US1] Update `apps/web/src/app/login/page.tsx`: add the same authenticated-user redirect — read `blockora-session` cookie; if present call `redirect('/')`

**Checkpoint**: Full US1 flow works independently — register, persist session, logout, re-login.

---

## Phase 4: User Story 2 — View Real Blocks on Dashboard (Priority: P2)

**Goal**: Dashboard fetches and displays the authenticated user's real blocks from the backend; mock data is fully removed.

**Independent Test**: Log in, open `/` → block list matches what is stored in the backend (verify via `GET /blocks` with a Bearer token). Empty state is shown for a new account. Refresh the page — blocks are still shown.

- [x] T022 [US2] Update `apps/web/src/app/page.tsx`: remove the `getMockBlocks()` import and call; pass `blocks={[]}` to `<DashboardPage />`; keep the existing `blockora-session` cookie redirect guard unchanged
- [x] T023 [US2] Update `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx`: add a `useEffect` on mount that calls `blocksApi.getBlocks()` and sets the `blocks` state with the server response; add a `loading` boolean state (default `true`) — while loading render 3 greyed skeleton card placeholders instead of the grid; add an `error` string state — on fetch failure set error and render an error banner with the message; remove the import of `getAllTags` from `shared/lib/mock-data` and inline the tag-extraction logic directly (`blocks.flatMap(b => b.tags)` deduplicated)
- [x] T024 [US2] Delete `apps/web/src/shared/lib/mock-data.ts` and remove its export from `apps/web/src/shared/lib/index.ts`; fix any remaining import errors that reference `mock-data`

**Checkpoint**: Dashboard shows live blocks from the API; no mock data references remain. Run `yarn tsc --noEmit` — zero errors.

---

## Phase 5: User Story 3 — Create a Block (Priority: P3)

**Goal**: The create-block dialog persists a new block to the backend; the returned server block (with real UUID and timestamps) is inserted into the local list.

**Independent Test**: Log in, click "Create Block", fill in a title and content, submit → the new block appears in the list immediately with a real UUID. Reload the page → the block is still present (persisted on server).

- [x] T025 [US3] Update `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx`: change `handleCreateBlock` to accept `Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'archivedAt'>` and call `blocksApi.createBlock(data)`; on success prepend the returned `Block` object (from the server) to the `blocks` state instead of constructing a local object; on `ApiError` show `toast.error()` with the extracted message and do NOT add a local block; keep the dialog open on error; update `CreateBlockDialog`'s `onSubmit` prop type to match
- [x] T026 [US3] Update `apps/web/src/features/create-block/ui/create-block-dialog.tsx`: update the `onSubmit` prop type so it accepts the same narrowed block shape (remove `id`, `createdAt`, `updatedAt`, `status`, `userId`, `archivedAt` from the argument); ensure `TYPE_OPTIONS` values are uppercase (`NOTE`, `TASK`, `SNIPPET`, `IDEA`); ensure `type` state initial value is `'NOTE'`

**Checkpoint**: Creating a block persists to the server and survives a page reload.

---

## Phase 6: User Story 4 — Edit an Existing Block (Priority: P4)

**Goal**: Users can open a pre-filled edit dialog from the block detail sheet; changes are persisted via `PATCH /blocks/:id` and reflected immediately in the list.

**Independent Test**: Log in, click a block card → detail sheet opens. Click "Edit" → pre-filled dialog opens with current values. Change the title → save. Title updates in the list immediately. Reload → updated title persists.

- [x] T027 [US4] Create `apps/web/src/features/edit-block/ui/edit-block-dialog.tsx`: Dialog component accepting `block: Block`, `open: boolean`, `onClose: () => void`, `onSave: (updated: Block) => void` props; pre-fills title, content, type, and tags fields from `block`; on submit calls `blocksApi.updateBlock(block.id, changes)`; on success calls `onSave(updatedBlock)` and closes the dialog with `toast.success()`; on `ApiError` shows `toast.error()` and keeps dialog open; export `EditBlockDialog` from the file
- [x] T028 [P] [US4] Create `apps/web/src/features/edit-block/index.ts` that re-exports `EditBlockDialog`
- [x] T029 [US4] Update `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx`: add `editingBlock: Block | null` state (default `null`); add `handleSaveEdit(updated: Block)` that replaces the matching block in `blocks` state by id; in `BlockDetailSheet` add an "Edit" button that sets `editingBlock = selectedBlock`; render `<EditBlockDialog block={editingBlock} open={editingBlock !== null} onClose={() => setEditingBlock(null)} onSave={handleSaveEdit} />` alongside `CreateBlockDialog`

**Checkpoint**: Editing a block persists to the server and survives a page reload.

---

## Phase 7: User Story 5 — Delete a Block (Priority: P5)

**Goal**: Users can soft-delete a block via a delete button in the detail sheet; the block disappears immediately from the list and remains absent after reload.

**Independent Test**: Log in, open a block's detail sheet, click "Delete", confirm → block removed from list. Reload → block still absent. Cancel a deletion → block unchanged.

- [x] T030 [US5] Create `apps/web/src/features/delete-block/ui/delete-block-button.tsx`: renders a "Delete" `<Button variant="destructive">` that, on click, opens the shared `Dialog` for confirmation ("Are you sure? This cannot be undone."); on confirm calls `blocksApi.deleteBlock(blockId)`; on success calls `onDeleted()` callback and shows `toast.success()`; on `ApiError` shows `toast.error()` and keeps the dialog open; accepts props `blockId: string`, `blockTitle: string`, `onDeleted: () => void`; export `DeleteBlockButton`
- [x] T031 [P] [US5] Create `apps/web/src/features/delete-block/index.ts` that re-exports `DeleteBlockButton`
- [x] T032 [US5] Update `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx`: add `handleDeleteBlock(id: string)` that removes the block from `blocks` state by id and sets `selectedBlock` to `null`; in `BlockDetailSheet` render `<DeleteBlockButton blockId={block.id} blockTitle={block.title} onDeleted={() => handleDeleteBlock(block.id)} />`; close the detail sheet immediately after deletion

**Checkpoint**: Deleting a block removes it from the server and the UI; cancel leaves it intact.

---

## Phase 8: User Story 6 — View Profile Information (Priority: P6)

**Goal**: Profile page displays the authenticated user's real email fetched from the backend; hardcoded demo values are removed.

**Independent Test**: Log in as user `test@example.com`, navigate to `/profile` → the email field shows `test@example.com`. User ID field shows the real UUID from `/auth/me`.

- [x] T033 [US6] Update `apps/web/src/app/profile/page.tsx`: call `authApi.getMe()` to fetch the authenticated user; pass `initialEmail={user.email}` and `initialUserId={user.userId}` as props to `<ProfilePage />`; on fetch failure redirect to `/login` (assume token invalid)
- [x] T034 [US6] Update `apps/web/src/pages-flat/profile/ui/profile-page.tsx`: update `ProfilePageProps` to `{ initialEmail: string; initialUserId: string }` and pass both to `ProfileForm`
- [x] T035 [US6] Update `apps/web/src/features/update-profile/ui/profile-form.tsx`: update `ProfileFormProps` to accept `initialEmail: string` and `initialUserId: string`; display `initialEmail` in the email field (read-only, `disabled`); remove hardcoded `'1'` user ID and render `initialUserId` instead; remove `'Demo Account'` label and render `'Standard'`; keep the name field editable but wire the Save button to `toast.info('Profile editing coming soon.')` (no API call); remove the `initialName` prop (not returned by `/auth/me`)

**Checkpoint**: Profile page shows real email and user ID from the backend; no hardcoded demo values remain.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Wire the archive/restore action to the real API, verify type-safety, and validate the full end-to-end flow.

- [x] T036 [P] Update `handleArchive` in `apps/web/src/widgets/blocks-list/ui/blocks-client.tsx` to call `blocksApi.updateBlock(id, { status: nextStatus })` where `nextStatus` is `'ARCHIVED'` or `'ACTIVE'`; on success update the block in local state with the server response; on error show `toast.error()` and revert local state
- [x] T037 [P] Audit all remaining files under `apps/web/src/` for any references to old lowercase enum values (`'active'`, `'archived'`, `'Note'`, `'Task'`, `'Snippet'`, `'Idea'`) and update them to uppercase; run `yarn tsc --noEmit` to confirm zero TypeScript errors
- [ ] T038 Run the full end-to-end validation from `specs/001-frontend-api-integration/quickstart.md`: register → dashboard shows empty state → create block → edit block → delete block → archive block → profile shows real email; confirm all steps pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all tasks [P] can run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS** all user stories; T007 must finish before T008; T008 must finish before T009/T010; T011 must finish before T013/T014
- **User Stories (Phases 3–8)**: All depend on Phase 2 completion
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — no other story dependency
- **US2 (P2)**: Depends only on Phase 2 — no other story dependency; independently testable
- **US3 (P3)**: Depends on US2 (dashboard must display blocks before create is tested end-to-end)
- **US4 (P4)**: Depends on US3 (edit flow requires a block to exist on the server)
- **US5 (P5)**: Depends on US2 (delete requires blocks visible on dashboard)
- **US6 (P6)**: Depends only on Phase 2 — no other story dependency

### Within Each User Story

- Foundation tasks (T007–T014) must complete before story tasks
- T011 (Block type update) must complete before T013/T014 (fix downstream references)
- T008 (HTTP client) must complete before T009 and T010 (API modules depend on it)
- T015 (login) must complete before T017 (register shares the same token/cookie pattern)

### Parallel Opportunities

- Phase 1: T002–T006 all run in parallel
- Phase 2: T009 and T010 run in parallel (after T008); T012 runs in parallel with T011
- Phase 3: T016 (logout) runs in parallel with T017 (register-form); T018 runs in parallel
- Phase 5: T026 runs in parallel with blocks-client update (different files)
- Phase 6: T028 (index.ts) runs in parallel with T027 (dialog component)
- Phase 7: T031 (index.ts) runs in parallel with T030 (button component)
- Phase 9: T036 and T037 run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```text
# After T007 (token-storage) and T008 (http-client) complete:
Parallel group A:
  Task T009: Create apps/web/src/shared/api/auth.api.ts
  Task T010: Create apps/web/src/shared/api/blocks.api.ts

# After T011 (block types update):
Parallel group B:
  Task T012: Update apps/web/src/entities/user/model/types.ts
  Task T013: Update apps/web/src/shared/lib/tag-colors.ts
# Then:
  Task T014: Fix all downstream type references (depends on T011 + T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (T007–T014)
3. Complete Phase 3: User Story 1 (T015–T021) — **register, login, logout all wired**
4. **STOP and VALIDATE**: Register a new account, log in, log out, re-login
5. Deploy/demo the auth integration independently

### Incremental Delivery

1. Setup + Foundational → token/auth/block API modules ready
2. US1 (auth) → real login/register/logout → deploy/demo
3. US2 (dashboard) → live block list, no mock data → deploy/demo
4. US3 (create) → block creation persists → deploy/demo
5. US4 (edit) + US5 (delete) → full CRUD → deploy/demo
6. US6 (profile) → real user data → deploy/demo
7. Polish → archive wired, type audit, e2e validation

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Phase 1: Setup | T001–T006 | 6 |
| Phase 2: Foundational | T007–T014 | 8 |
| Phase 3: US1 Register + Login | T015–T021 | 7 |
| Phase 4: US2 Real Dashboard | T022–T024 | 3 |
| Phase 5: US3 Create Block | T025–T026 | 2 |
| Phase 6: US4 Edit Block | T027–T029 | 3 |
| Phase 7: US5 Delete Block | T030–T032 | 3 |
| Phase 8: US6 Profile | T033–T035 | 3 |
| Phase 9: Polish | T036–T038 | 3 |
| **Total** | | **38** |

---

## Notes

- `[P]` tasks operate on different files and have no mutual dependency — they can be delegated to parallel agents
- Each user story phase ends with a named **Checkpoint** describing the independently-verifiable state
- Tests are not included as separate tasks (not explicitly requested in spec); tests should be written alongside implementation per the Constitution
- All paths are relative to the monorepo root; prefix with `/home/skaylet/dev/turbo-app/` for absolute paths
- Run `cd apps/web && yarn tsc --noEmit` after each phase to catch type errors early
