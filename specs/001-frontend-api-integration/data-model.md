# Data Model: Frontend–Backend API Integration

**Feature**: 001-frontend-api-integration
**Phase**: 1 — Design
**Date**: 2026-02-28

---

## Overview

This document describes the data shapes exchanged between the frontend and the deployed backend API. It also defines the updated frontend entity types that align with the backend's Prisma-generated enum values.

---

## Entities

### 1. User

Represents an authenticated account. Returned by `GET /auth/me`.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `string` (UUID) | Primary identifier |
| `email` | `string` | Unique, validated |

**Frontend type** (`entities/user/model/types.ts`):
```ts
export interface User {
  userId: string;
  email: string;
}
```

---

### 2. Token Pair

Issued on register, login, and refresh. Stored in `localStorage`.

| Field | Type | Notes |
|-------|------|-------|
| `accessToken` | `string` (JWT) | Short-lived (≤15 min). Sent as `Authorization: Bearer <token>` |
| `refreshToken` | `string` | Long-lived (≤7 days). Sent to `POST /auth/refresh` for rotation |

**Frontend type** (`shared/api/auth.api.ts`):
```ts
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

**Storage** (`shared/lib/token-storage.ts`):
- `localStorage.setItem('blockora-access-token', pair.accessToken)`
- `localStorage.setItem('blockora-refresh-token', pair.refreshToken)`

---

### 3. Block

The primary content entity. Returned by block endpoints. Replaces the current frontend `Block` interface.

**Updated enum values** (matching backend Prisma enums exactly):

```ts
export type BlockType = 'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA';
export type BlockStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type BlockVisibility = 'PRIVATE' | 'PUBLIC';
```

**Block interface**:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Backend-assigned |
| `userId` | `string` (UUID) | Owner |
| `title` | `string` | Min 1 char |
| `content` | `string` | Body text |
| `type` | `BlockType` | Defaults to `NOTE` |
| `status` | `BlockStatus` | `ACTIVE` → `ARCHIVED` (or `DELETED` via delete endpoint) |
| `visibility` | `BlockVisibility` | Defaults to `PRIVATE` |
| `tags` | `string[]` | Arbitrary string labels |
| `createdAt` | `string` (ISO 8601) | Set by server |
| `updatedAt` | `string` (ISO 8601) | Updated by server on PATCH |
| `archivedAt` | `string \| null` | Set when status transitions to `ARCHIVED` |

**Updated frontend type** (`entities/block/model/types.ts`):
```ts
export type BlockType = 'NOTE' | 'TASK' | 'SNIPPET' | 'IDEA';
export type BlockStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type BlockVisibility = 'PRIVATE' | 'PUBLIC';

export interface Block {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: BlockType;
  status: BlockStatus;
  visibility: BlockVisibility;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
```

---

## Request Payloads

### Register (`POST /auth/register`)

```ts
interface RegisterBody {
  email: string;        // required, valid email
  password: string;     // required, min 8 chars
  displayName?: string; // optional
}
```

### Login (`POST /auth/login`)

```ts
interface LoginBody {
  email: string;
  password: string;
}
```

### Refresh (`POST /auth/refresh`)

```ts
interface RefreshBody {
  refreshToken: string;
}
```

### Create Block (`POST /blocks`)

```ts
interface CreateBlockBody {
  title: string;           // required, min 1 char
  content: string;         // required
  type?: BlockType;        // optional, defaults to NOTE
  visibility?: BlockVisibility; // optional, defaults to PRIVATE
  tags?: string[];         // optional
}
```

### Update Block (`PATCH /blocks/:id`)

```ts
interface UpdateBlockBody {
  title?: string;
  content?: string;
  type?: BlockType;
  visibility?: BlockVisibility;
  tags?: string[];
}
```

---

## State Transitions

### Block Status

```
ACTIVE ──archive──► ARCHIVED
ARCHIVED ──restore──► ACTIVE
ACTIVE or ARCHIVED ──delete──► DELETED (soft-delete, removed from list)
```

- Archive/restore is a PATCH to `{ status: 'ARCHIVED' }` / `{ status: 'ACTIVE' }`
- Delete is `DELETE /blocks/:id` (backend sets `status = DELETED`)
- Blocks with `status = DELETED` are excluded by the backend's `findAll()` query

---

## Downstream Impact of Enum Update

The following files require updates when `BlockType`/`BlockStatus` values change from PascalCase/lowercase to UPPER_CASE:

| File | Change Required |
|------|----------------|
| `entities/block/model/types.ts` | New enum values (see above) |
| `widgets/blocks-list/ui/blocks-client.tsx` | `BLOCK_TYPES` array values, `activeTab` initial value (`'ACTIVE'`), filter comparisons |
| `entities/block/ui/block-card.tsx` | Display labels (map `NOTE` → `Note`, etc.) |
| `features/create-block/ui/create-block-dialog.tsx` | `TYPE_OPTIONS` values |
| `shared/lib/tag-colors.ts` | `TYPE_COLORS` keys if type-keyed |
| `shared/lib/mock-data.ts` | Remove entirely (replaced by real API) |

---

## Token Storage Schema

```ts
// shared/lib/token-storage.ts
const ACCESS_TOKEN_KEY = 'blockora-access-token';
const REFRESH_TOKEN_KEY = 'blockora-refresh-token';

interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(pair: TokenPair): void;
  clearTokens(): void;
}
```
