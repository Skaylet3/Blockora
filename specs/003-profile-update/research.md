# Research: User Profile Update

**Feature**: 003-profile-update
**Date**: 2026-03-02

## Decision 1: Where to place the profile update endpoint

**Decision**: Create a new `UsersModule` (`src/users/`) containing `UsersController`,
`UsersService`, and related DTOs. The update endpoint is `PATCH /users/me`.

**Rationale**: The existing `AuthModule` is focused on authentication concerns
(register, login, token refresh/revocation). Mixing profile mutation into `AuthService`
violates the single-responsibility principle and makes the auth module harder to maintain.
The existing `BlockModule` sets the precedent for a standalone feature module that imports
shared infrastructure (`PrismaModule`) without coupling to the auth internals.

**Alternatives considered**:
- `PATCH /auth/me` in `AuthController`: Rejected — blends profile management into the auth
  domain, making `AuthService` responsible for both credential and profile mutations.
- `PUT /users/me`: Rejected — PUT semantics require sending the full resource; `PATCH` is
  correct for partial updates and matches how `BlockController` handles updates.

---

## Decision 2: DTO pattern for future-proof partial updates

**Decision**: Define `UpdateProfileDto` as a class with individually `@IsOptional()` fields
validated with `class-validator`. All fields are optional at the DTO level; the service
applies only the provided fields using Prisma's selective update semantics.

**Rationale**: The spec requires that omitted fields retain their current values (FR-004).
The existing codebase already uses this pattern via `PartialType` in `UpdateBlockDto`
(`PartialType(CreateBlockDto)`). For profile updates, however, a standalone DTO with
explicit validators is preferred because `displayName` has different constraints than any
"create" payload would imply — it can be cleared (empty string → null), which is a
meaningful state, not just "field not provided".

**Alternatives considered**:
- `PartialType(CreateProfileDto)`: Valid pattern but requires a `CreateProfileDto` base class
  that doesn't exist. For a single-field DTO, the overhead is not worthwhile.
- Full-replacement `PUT` with all fields required: Rejected — violates future-proof
  requirement (new fields would be breaking changes for all existing clients).

---

## Decision 3: How to return `displayName` from `GET /auth/me`

**Decision**: `AuthController.me()` is updated to call `UsersService.getProfile(userId)`,
which performs a single DB lookup to fetch the user record including `displayName`. The
`AuthModule` imports `UsersModule` (which exports `UsersService`).

**Rationale**: `displayName` is not embedded in the JWT payload (JWT carries only `sub` and
`email`). A DB lookup is required. Delegating this to `UsersService` keeps the query logic
in one place and avoids duplicating Prisma calls in `AuthService`. The lookup is a single
indexed read by primary key — negligible overhead.

**Alternatives considered**:
- Embed `displayName` in the JWT at login/register: Rejected — the JWT would become stale
  immediately after a profile update; all tokens would need rotation on every profile save,
  which is expensive and operationally fragile.
- Add a separate `GET /users/me` endpoint: Rejected — the spec assumption explicitly states
  "the existing profile retrieval endpoint will be extended"; adding a second retrieval URL
  creates ambiguity for the frontend.
- Inject `PrismaService` directly into `AuthController`: Rejected — violates the module
  boundary by bypassing the service layer.

---

## Decision 4: Frontend API location

**Decision**: Add `updateProfile(body: UpdateProfileBody)` to the existing `authApi` object
in `apps/web/src/shared/api/auth.api.ts`. Targets `PATCH /users/me`.

**Rationale**: The frontend currently has one API file for user-related calls (`auth.api.ts`),
which already contains `getMe()`. Co-locating `updateProfile` avoids proliferating API files
for what is conceptually part of the same user-identity domain. The `http-client` `request`
function already handles `PATCH` (the `RequestOptions` type includes it).

**Alternatives considered**:
- New `user.api.ts` file: Reasonable for a larger feature set, but premature given there are
  only two user API calls total. Deferred until the users API grows meaningfully.

---

## Decision 5: Cancel button behaviour

**Decision**: The `ProfileForm` component tracks `savedValues` (the last successfully fetched
or saved profile state). Clicking Cancel resets the form fields to `savedValues` without
making a network request.

**Rationale**: FR-010 specifies Cancel must not make a server request. The form must maintain
a local snapshot of the last confirmed server state to support reset behaviour.

---

## Decision 6: No database migration required

**Decision**: No migration is needed. `displayName String?` already exists on the `User`
model in `prisma/schema.prisma` and is populated during registration. This feature only
exposes it for post-registration editing.

**Rationale**: The field exists but was previously not exposed via any update endpoint. No
schema change means no migration risk.
