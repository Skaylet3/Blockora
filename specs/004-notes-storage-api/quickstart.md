# Quickstart: Notes & Storage API

**Feature**: 004-notes-storage-api | **Date**: 2026-03-04

---

## Prerequisites

- Node.js >=18
- Yarn 1.22 (classic)
- PostgreSQL database (connection string in `apps/api/.env`)
- Existing `.env` with `DATABASE_URL`, `JWT_SECRET` (≥32 chars)
- Branch: `004-notes-storage-api`

---

## 1. Run the Prisma Migration

After adding the `Storage` and `Note` models to `prisma/schema.prisma`:

```bash
cd apps/api
yarn prisma migrate dev --name add_storage_and_note
```

This creates the migration file and applies it to the development database.

---

## 2. Run the API in Development

```bash
# From repo root
yarn dev
# OR from apps/api
cd apps/api && yarn start:dev
```

The API starts on `http://localhost:3000`. Swagger docs are at `http://localhost:3000/api/docs`.

---

## 3. Try the Endpoints (requires a valid access token)

First, register and get a token:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# → { "accessToken": "...", "refreshToken": "..." }
```

Create a root storage:
```bash
curl -X POST http://localhost:3000/storages \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work"}'
# → { "id": "...", "name": "Work", "parentId": null, ... }
```

Create a note in that storage:
```bash
curl -X POST http://localhost:3000/notes \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Meeting Notes","content":"Discussed Q1 goals","storageId":"<storageId>"}'
```

List all storages (tree data — flat, reconstruct on frontend):
```bash
curl http://localhost:3000/storages \
  -H "Authorization: Bearer <accessToken>"
```

List notes in a storage:
```bash
curl "http://localhost:3000/notes?storageId=<storageId>" \
  -H "Authorization: Bearer <accessToken>"
```

---

## 4. Run Tests

```bash
cd apps/api

# Unit tests (fast, no DB required)
yarn test

# Integration tests (requires running DB)
yarn test:int

# E2E tests (requires running API + DB)
yarn test:e2e
```

New test files to look for:
- `src/storage/storage.service.spec.ts`
- `src/storage/storage.controller.spec.ts`
- `src/note/note.service.spec.ts`
- `src/note/note.controller.spec.ts`
- `test/integration/storage.service.int-spec.ts`
- `test/integration/note.service.int-spec.ts`
- `test/e2e/storages.e2e-spec.ts`
- `test/e2e/notes.e2e-spec.ts`

---

## 5. Key Implementation Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add Storage and Note models |
| `prisma/migrations/*/migration.sql` | Auto-generated migration |
| `src/storage/storage.module.ts` | StorageModule definition |
| `src/storage/storage.service.ts` | Storage CRUD logic |
| `src/storage/storage.controller.ts` | GET /storages, POST /storages, DELETE /storages/:id |
| `src/storage/dto/` | CreateStorageDto, StorageResponseDto |
| `src/note/note.module.ts` | NoteModule definition |
| `src/note/note.service.ts` | Note CRUD logic |
| `src/note/note.controller.ts` | GET /notes, POST /notes, GET /notes/:id, PATCH /notes/:id, DELETE /notes/:id |
| `src/note/dto/` | CreateNoteDto, UpdateNoteDto, NoteResponseDto |
| `src/app.module.ts` | Import StorageModule and NoteModule |
