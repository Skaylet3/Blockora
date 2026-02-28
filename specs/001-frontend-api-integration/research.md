# Research: Frontend–Backend API Integration

**Feature**: 001-frontend-api-integration
**Phase**: 0 — Research & Unknowns Resolution
**Date**: 2026-02-28

---

## Decision 1: HTTP Client Approach

**Decision**: Use native browser `fetch` wrapped in a thin typed helper — no external HTTP library.

**Rationale**: The `apps/web` package.json has no axios or similar library. `fetch` is universally available in Next.js 16 / Node 18+ environments. A hand-rolled wrapper:
- Keeps the dependency surface minimal (aligns with Constitution III – Simplicity)
- Allows attaching the `Authorization: Bearer <token>` header in one place
- Can implement silent token refresh (retry-on-401) without framework coupling
- Gives complete TypeScript control over response shape

**Alternatives Considered**:
- `axios` — would need to be installed; adds ~50KB; no compelling benefit over fetch for this scope
- SWR / TanStack Query — powerful but overkill for the MVP fetch patterns here; Constitution III applies

**Location in FSD**: `apps/web/src/shared/api/http-client.ts`

---

## Decision 2: Token Storage Strategy

**Decision**: `localStorage` for access token and refresh token; additionally write a short-lived `blockora-session` cookie (value `1`, `max-age=86400`) on login and clear it on logout.

**Rationale**:
- The spec and existing code already use `blockora-session` cookie for SSR route protection in `app/page.tsx` (server component reads cookie via `next/headers`).
- localStorage is accessible client-side for attaching Bearer tokens to every API request.
- Storing the session cookie preserves the existing SSR routing pattern without rewriting the Next.js app router layout.
- The access token is NOT stored in the cookie — the cookie is a boolean flag only. This avoids sending the JWT to the server on every request (unnecessary because SSR pages don't currently call the API server-side).

**Alternatives Considered**:
- httpOnly cookies for the JWT — would require the API to set cookies via `Set-Cookie` headers, but the backend currently returns tokens as JSON body only. Not feasible without backend changes.
- Cookie-only (accessible) — same CSRF surface as localStorage but with more cookie overhead on every SSR request.

**localStorage Keys**:
- `blockora-access-token` — short-lived JWT
- `blockora-refresh-token` — long-lived token (7 days)

**Location in FSD**: `apps/web/src/shared/lib/token-storage.ts`

---

## Decision 3: Silent Token Refresh (Interceptor Pattern)

**Decision**: Implement a retry-once interceptor inside the HTTP client. On any `401 Unauthorized` response:
1. Call `POST /auth/refresh` with the stored refresh token
2. If refresh succeeds: update stored tokens, retry the original request with the new access token
3. If refresh fails (token revoked or expired): clear tokens, clear session cookie, redirect to `/login`

**Rationale**: This satisfies FR-004 (transparent refresh) without any external state management library. The interceptor is co-located in `shared/api/http-client.ts` — one place to maintain.

**Alternatives Considered**:
- Proactive refresh (before expiry via setTimeout) — harder to manage with server-side rendering and tab focus; error-prone if tabs multiply.
- Middleware-based refresh (Next.js `middleware.ts`) — cannot run async API calls in Edge runtime reliably.

---

## Decision 4: Route Protection Mechanism

**Decision**: Keep existing server-side cookie check (`blockora-session`) in `app/page.tsx` and `app/profile/page.tsx` for protected route guards. Add a matching check in `app/register/page.tsx` and `app/login/page.tsx` to redirect authenticated users away.

**Rationale**: The cookie approach already works in the current codebase. No Next.js middleware rewrite is needed. The session cookie is set on login/register and cleared on logout — these are the only two state transitions. Simpler than introducing a middleware.ts file.

**Alternatives Considered**:
- Next.js `middleware.ts` — would centralise the check, but requires reliable cookie parsing in the Edge runtime; adds complexity.
- Client-side only guard (useEffect redirect) — causes a flash of protected content before redirect; worse UX.

---

## Decision 5: Block Type Enum Normalization

**Decision**: Update `apps/web/src/entities/block/model/types.ts` to use UPPER_CASE enum values matching the backend Prisma enums exactly.

**Rationale**: The backend returns `BlockType` as `NOTE | TASK | SNIPPET | IDEA`, `BlockStatus` as `ACTIVE | ARCHIVED | DELETED`, and `BlockVisibility` as `PRIVATE | PUBLIC`. The current frontend uses lowercase/PascalCase variants. Normalizing avoids silent type errors and eliminates the need for mapping layers.

**Frontend Types After Update**:
```ts
export type BlockType = 'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA';
export type BlockStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type BlockVisibility = 'PRIVATE' | 'PUBLIC';
```

**Downstream Changes Required**:
- `blocks-client.tsx`: Update `BLOCK_TYPES` array values, `activeTab` initial state, filter logic
- `block-card.tsx`: Update type display labels
- `create-block-dialog.tsx`: Update TYPE_OPTIONS values
- `tag-colors.ts` / `TYPE_COLORS`: Update keys if type-keyed
- `shared/lib/mock-data.ts`: Update mock data (or delete it)

---

## Decision 6: FSD Architecture for New Modules

**Decision**: Follow the existing FSD layers strictly. No new layers; new features fit into existing slots.

**New files and their FSD layer**:

| File | Layer | Reason |
|------|-------|--------|
| `shared/api/http-client.ts` | shared | Reusable across features; no business logic |
| `shared/api/auth.api.ts` | shared | API call definitions; consumed by multiple features |
| `shared/api/blocks.api.ts` | shared | API call definitions; consumed by multiple features |
| `shared/lib/token-storage.ts` | shared | Utility; no UI |
| `entities/user/model/types.ts` | entities | Core domain entity |
| `features/auth/model/auth.api.ts` | features | **Moved to shared/api** — auth API is shared |
| `features/register/ui/register-form.tsx` | features | New user action slice |
| `features/edit-block/ui/edit-block-dialog.tsx` | features | New block mutation slice |
| `features/delete-block/ui/delete-block-button.tsx` | features | New block mutation slice |
| `pages-flat/register/ui/register-page.tsx` | pages-flat | Page composition |
| `app/register/page.tsx` | app | Next.js route |

**SOLID compliance points**:
- **S**: Each API module has one responsibility (`auth.api.ts` handles auth calls, `blocks.api.ts` handles block calls)
- **O**: `http-client.ts` is extensible via options without modifying its core logic
- **L**: All API functions return stable typed shapes; callers are not aware of fetch internals
- **I**: Auth callers only import `auth.api.ts`; block callers only import `blocks.api.ts`
- **D**: Feature components depend on typed API function signatures, not on `fetch` directly

---

## Decision 7: Profile Page Scope

**Decision**: The profile page displays the authenticated user's `email` and `displayName` from `GET /auth/me`. The existing editable form fields (`name`, `email`) are retained visually but saving is wired to a no-op or a clear in-scope endpoint. Since `/auth/me` is read-only and no profile-update endpoint exists, the Save button remains in the UI but shows a "Feature coming soon" toast.

**Rationale**: Spec explicitly marks profile editing as out of scope (see Assumptions). Keeping the form in a visually consistent state avoids breaking the profile page layout while being honest about functionality.

**Alternatives Considered**:
- Remove Save button — changes layout significantly, scope creep
- Wire Save to a future endpoint — no such endpoint exists; would result in a 404

---

## Decision 8: Block Deletion UI

**Decision**: Add a "Delete" button inside the `BlockDetailSheet` (the right-side drawer that opens when a block is clicked). The button opens a confirmation via the existing shared `Dialog` component. On confirm, calls `DELETE /blocks/:id`, then removes the block from local state.

**Rationale**: The `BlockDetailSheet` is already where the Archive/Restore action lives. Adding Delete here keeps all destructive actions in one panel (better UX than adding delete to the card directly). Consistent with existing patterns.

---

## Decision 9: Block Edit UI

**Decision**: Add an "Edit" button inside the `BlockDetailSheet`. Clicking it opens a new `EditBlockDialog` (new feature: `features/edit-block/`) pre-filled with current block values. On submit, calls `PATCH /blocks/:id` and updates the block in local state.

**Rationale**: Follows the same pattern as Create. Reuses shared form components (Input, Textarea, Select, Dialog). Keeps the edit action discoverable in context (inside the detail sheet).

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|-----------|
| HTTP client library | Native `fetch` with typed wrapper |
| Token storage | localStorage + session cookie flag for SSR |
| Silent refresh | Retry-on-401 in http-client |
| Route protection | Existing cookie pattern, extended to new routes |
| Block enum mismatch | Update frontend types to match backend UPPER_CASE |
| Profile edit endpoint | Not available; Save shows "coming soon" |
| Delete UI placement | Inside BlockDetailSheet (existing pattern) |
| Edit UI placement | Inside BlockDetailSheet → EditBlockDialog |
