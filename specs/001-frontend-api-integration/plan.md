# Implementation Plan: Frontend–Backend API Integration

**Branch**: `001-frontend-api-integration` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-api-integration/spec.md`

## Summary

Replace all mock data and demo auth in `apps/web` with real API calls to the deployed backend at `https://blockora-api.vercel.app/api`. Scope: 10 endpoints (5 auth + 5 block). Deliverables: register page (same style as login), token-based auth with silent refresh, real block CRUD on the dashboard (including edit and delete actions), and live profile display — all organised under the existing FSD architecture with SOLID-principled API modules.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode) — `apps/web` (Next.js 16, React 19)
**Primary Dependencies**: Next.js 16.1.6, React 19, Tailwind CSS v4, Sonner (toasts), Lucide React, Radix UI primitives — no external HTTP library (uses native `fetch`)
**Storage**: `localStorage` for access + refresh tokens; session cookie (`blockora-session=1`) retained for SSR route-guard only
**Testing**: Vitest 3 + @testing-library/react 16 (component tests); Playwright 1.50 (E2E)
**Target Platform**: Browser (SPA) + Next.js SSR server (Node 18+)
**Project Type**: Web application — frontend only changes (no backend changes)
**Performance Goals**: Block list fetch < 200 ms perceived; CRUD operations reflect in UI < 3 s (Constitution IV)
**Constraints**: Zero cross-layer FSD imports; TypeScript strict mode; no new external dependencies
**Scale/Scope**: Single authenticated user at a time; ≤ 100 blocks per user in MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Blocks Are Atomic | Block entity model updated to match backend schema exactly; no merging with other domain objects | ✅ PASS |
| II. Privacy by Default | All block API calls include `Authorization: Bearer` header; backend already scopes to authenticated user | ✅ PASS |
| III. Simplicity Over Features | No new external dependencies; no features beyond the 10 endpoints specified; profile editing explicitly deferred | ✅ PASS |
| IV. Performance is a Feature | Client-side fetch keeps pages responsive; optimistic UI updates for CRUD; token refresh is async/transparent | ✅ PASS |
| V. Type-Safe and Test-Driven | Frontend types updated to match backend Prisma enums exactly; unit and E2E tests required per feature | ✅ PASS |
| VI. Monorepo Discipline | All changes within `apps/web/src`; FSD layer rules respected; no cross-app imports outside `packages/` | ✅ PASS |

**Post-Design Re-check**: All gates still pass after Phase 1 design. No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-api-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output — API contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code Layout

```text
apps/web/src/
│
├── app/                                  [Next.js App Router — route definitions]
│   ├── page.tsx                          MODIFY: replace getMockBlocks() with real API call
│   ├── login/page.tsx                    MODIFY: redirect authenticated users to /
│   ├── register/                         NEW
│   │   └── page.tsx                      NEW: route wrapper, redirect authenticated users
│   └── profile/page.tsx                  MODIFY: fetch real user data
│
├── pages-flat/                           [FSD: page compositions]
│   ├── dashboard/ui/dashboard-page.tsx   no change (accepts blocks prop)
│   ├── login/ui/login-page.tsx           no change
│   ├── register/                         NEW
│   │   ├── index.ts                      NEW
│   │   └── ui/register-page.tsx          NEW: mirrors login-page.tsx structure
│   └── profile/ui/profile-page.tsx       no change
│
├── features/                             [FSD: user-facing feature slices]
│   ├── auth/
│   │   ├── ui/
│   │   │   ├── login-form.tsx            MODIFY: call auth.api login, store tokens
│   │   │   ├── logout-button.tsx         MODIFY: call auth.api logout, clear tokens
│   │   │   └── register-form.tsx         NEW: mirrors login-form.tsx, calls auth.api register
│   │   └── index.ts                      MODIFY: export register-form
│   ├── create-block/
│   │   └── ui/create-block-dialog.tsx    MODIFY: onSubmit calls blocks.api create, receives Block back
│   ├── edit-block/                       NEW
│   │   ├── index.ts                      NEW
│   │   └── ui/edit-block-dialog.tsx      NEW: pre-filled dialog, calls blocks.api update
│   ├── delete-block/                     NEW
│   │   ├── index.ts                      NEW
│   │   └── ui/delete-block-button.tsx    NEW: confirm dialog + calls blocks.api delete
│   └── update-profile/
│       └── ui/profile-form.tsx           MODIFY: load from /auth/me; Save shows "coming soon"
│
├── widgets/
│   └── blocks-list/
│       └── ui/blocks-client.tsx          MODIFY: fetch real blocks on mount; wire edit+delete
│
├── entities/
│   ├── block/
│   │   ├── model/types.ts                MODIFY: UPPER_CASE enums, add userId/visibility/archivedAt
│   │   ├── ui/block-card.tsx             MODIFY: update type/status display labels
│   │   └── index.ts                      no change
│   └── user/
│       ├── model/types.ts                MODIFY: add userId field (was empty)
│       └── index.ts                      no change
│
└── shared/
    ├── api/                              NEW directory
    │   ├── http-client.ts               NEW: fetch wrapper with auth header + 401 retry
    │   ├── auth.api.ts                  NEW: register, login, refresh, logout, me
    │   └── blocks.api.ts               NEW: getBlocks, getBlock, createBlock, updateBlock, deleteBlock
    ├── lib/
    │   ├── token-storage.ts            NEW: getAccessToken, getRefreshToken, setTokens, clearTokens
    │   ├── mock-data.ts                REMOVE: replaced by real API
    │   ├── tag-colors.ts               MODIFY: update TYPE_COLORS keys to UPPER_CASE
    │   └── utils.ts                    no change
    └── ui/                             no change
```

## Complexity Tracking

> No constitution violations to justify.

## Implementation Phases

### Phase A — Foundation (Shared API Layer)

Establish the infrastructure that all other changes depend on. No UI changes yet.

**A1. Token Storage** (`shared/lib/token-storage.ts`)
- Implement `getAccessToken()`, `getRefreshToken()`, `setTokens(pair)`, `clearTokens()`
- Use `localStorage` keys `blockora-access-token` and `blockora-refresh-token`
- Guard against SSR (`typeof window === 'undefined'` check)

**A2. HTTP Client** (`shared/api/http-client.ts`)
- Typed `request<T>(path, options)` wrapper over native `fetch`
- Reads `NEXT_PUBLIC_API_BASE_URL` env var (set to `https://blockora-api.vercel.app/api`)
- Attaches `Authorization: Bearer <token>` for authenticated requests
- On `401`: calls `POST /auth/refresh` once, retries, or clears tokens + redirects
- Throws typed `ApiError` on non-2xx (preserves `message` array or string)
- `skipAuth: true` flag for auth endpoints (register, login, refresh)

**A3. Auth API Module** (`shared/api/auth.api.ts`)
- `register(body)` → `POST /auth/register` (skipAuth)
- `login(body)` → `POST /auth/login` (skipAuth)
- `refresh(body)` → `POST /auth/refresh` (skipAuth)
- `logout()` → `POST /auth/logout`
- `getMe()` → `GET /auth/me`
- All return typed shapes from `data-model.md`

**A4. Blocks API Module** (`shared/api/blocks.api.ts`)
- `getBlocks()` → `GET /blocks`
- `getBlock(id)` → `GET /blocks/:id`
- `createBlock(body)` → `POST /blocks`
- `updateBlock(id, body)` → `PATCH /blocks/:id`
- `deleteBlock(id)` → `DELETE /blocks/:id`

**A5. Environment Variable**
- Add `NEXT_PUBLIC_API_BASE_URL=https://blockora-api.vercel.app/api` to `apps/web/.env.local`
- Document in `apps/web/.env.example`

---

### Phase B — Entity Types Update

**B1. Block Types** (`entities/block/model/types.ts`)
- Change `BlockType` to `'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA'`
- Add `BlockStatus`: `'ACTIVE' | 'ARCHIVED' | 'DELETED'`
- Add `BlockVisibility`: `'PRIVATE' | 'PUBLIC'`
- Update `Block` interface: add `userId`, `visibility`, `archivedAt`

**B2. User Types** (`entities/user/model/types.ts`)
- Add `User` interface: `{ userId: string; email: string }`

**B3. Fix downstream type references** (to compile after B1)
- `blocks-client.tsx` — update `activeTab` default, filter comparisons, `BLOCK_TYPES` values
- `block-card.tsx` — update display labels (map `NOTE` → `Note` for display)
- `create-block-dialog.tsx` — update `TYPE_OPTIONS` values
- `tag-colors.ts` — update `TYPE_COLORS` keys

---

### Phase C — Auth Integration

**C1. Update Login Form** (`features/auth/ui/login-form.tsx`)
- Call `authApi.login({ email, password })`
- On success: `tokenStorage.setTokens(pair)`, set `blockora-session=1` cookie, redirect to `/`
- On error: extract error message(s) from `ApiError`, show toast or inline error
- Remove demo text "Use any email and password"

**C2. Update Logout Button** (`features/auth/ui/logout-button.tsx`)
- Call `authApi.logout()` before clearing tokens
- Call `tokenStorage.clearTokens()`
- Clear `blockora-session` cookie
- Redirect to `/login`

**C3. Create Register Form** (`features/auth/ui/register-form.tsx`)
- Visually identical to `login-form.tsx` (same layout, logo, spacing)
- Fields: email, password, optional display name
- Call `authApi.register({ email, password, displayName })`
- On success: `tokenStorage.setTokens(pair)`, set session cookie, redirect to `/`
- On error: display error (409 = duplicate email, 422 = validation)
- Link at bottom: "Already have an account? Sign in" → `/login`

**C4. Create Register Page** (`pages-flat/register/ui/register-page.tsx` + `app/register/page.tsx`)
- Page wrapper following the same pattern as login
- Route: `/register`
- SSR redirect: if `blockora-session` cookie exists, redirect to `/` (already authenticated)

**C5. Update Login Page route** (`app/login/page.tsx`)
- Add SSR redirect: if `blockora-session` cookie exists, redirect to `/`

---

### Phase D — Dashboard & Block CRUD Integration

**D1. Update Dashboard Route** (`app/page.tsx`)
- Remove `getMockBlocks()` call
- Pass empty `blocks={[]}` to `DashboardPage`; real data fetched client-side

**D2. Update Blocks Client** (`widgets/blocks-list/ui/blocks-client.tsx`)
- Add `useEffect` to call `blocksApi.getBlocks()` on mount; populate local `blocks` state
- Add loading skeleton (e.g., 3 greyed card placeholders) while fetching
- Add error state: show error banner on fetch failure
- Update `handleCreateBlock`: call `blocksApi.createBlock(data)`, use server-returned `Block` object (replaces local-only `local-${Date.now()}` hack)
- Update `handleArchive`: call `blocksApi.updateBlock(id, { status: nextStatus })` (`ARCHIVED` or `ACTIVE`)
- Wire `BlockDetailSheet` to accept `onEdit` and `onDelete` callbacks
- Add import for `EditBlockDialog` and `DeleteBlockButton` features

**D3. Add Edit Action** (`features/edit-block/ui/edit-block-dialog.tsx`)
- Pre-filled form (title, content, type, tags)
- Submit calls `blocksApi.updateBlock(id, changes)`
- On success: update block in parent `blocks` state; close dialog; show success toast
- On error: show error toast; keep dialog open

**D4. Add Delete Action** (`features/delete-block/ui/delete-block-button.tsx`)
- Renders a "Delete" button
- On click: show confirmation using shared `Dialog`
- On confirm: call `blocksApi.deleteBlock(id)`
- On success: remove block from parent `blocks` state; close sheet; show success toast
- On error: show error toast; block remains in list

**D5. Update BlockDetailSheet** (inside `blocks-client.tsx`)
- Add "Edit" button → opens `EditBlockDialog`
- Add "Delete" button → renders `DeleteBlockButton`
- Existing Archive/Restore button: wired to real API (see D2)

**D6. Remove mock-data.ts** (`shared/lib/mock-data.ts`)
- Delete the file
- Remove all imports of `getMockBlocks` and `getAllTags` from `mock-data`
- Move `getAllTags` utility inline to `blocks-client.tsx` (it's a pure function of block array)

---

### Phase E — Profile Integration

**E1. Update Profile Route** (`app/profile/page.tsx`)
- Remove hardcoded `initialName` and `initialEmail` props
- Fetch user from `authApi.getMe()` server-side (or pass empty strings and fetch client-side)
- Pass `{ userId, email }` to `ProfilePage`

**E2. Update Profile Form** (`features/update-profile/ui/profile-form.tsx`)
- Display real `email` from props (read-only field for email)
- Display `userId` from `/auth/me` response in Account Information section
- Remove hardcoded `'1'` and `'Demo Account'`
- Save Changes → show `toast.info('Profile editing coming soon.')` (no API call; no endpoint available)

---

### Phase F — Tests

**F1. Unit tests for shared API modules**
- `shared/api/http-client.test.ts` — mock fetch; test auth header injection, 401 retry, token refresh
- `shared/lib/token-storage.test.ts` — test get/set/clear with mocked localStorage

**F2. Component tests for updated features**
- `login-form.test.tsx` — mock `authApi.login`; test success redirect, error display
- `register-form.test.tsx` — mock `authApi.register`; test success redirect, duplicate email error
- `blocks-client.test.tsx` — mock `blocksApi.getBlocks`; test loading state, block render, empty state
- `edit-block-dialog.test.tsx` — mock `blocksApi.updateBlock`; test pre-fill, success, error
- `delete-block-button.test.tsx` — mock `blocksApi.deleteBlock`; test confirm flow, cancel

**F3. E2E test updates** (Playwright)
- `auth.e2e.ts` — register → dashboard; login → dashboard; logout → login page
- `blocks.e2e.ts` — create block; edit block; delete block; archive block

---

## Quickstart

See [quickstart.md](./quickstart.md) for local setup and running instructions.

## Artifacts

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data Model | [data-model.md](./data-model.md) |
| API Contracts | [contracts/api.md](./contracts/api.md) |
| Tasks | [tasks.md](./tasks.md) *(generated by `/speckit.tasks`)* |
