# Quickstart: Todo API with Block Promotion

**Feature**: 006-todo-api

---

## Prerequisites

- Yarn 1.22 installed
- `apps/api/.env` with `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` set
- Prisma CLI available (`yarn prisma` from `apps/api/`)

---

## 1. Run the Prisma Migration

```bash
cd apps/api
yarn prisma migrate dev --name add-todo-model
```

This will:
1. Generate a new migration file under `prisma/migrations/`
2. Apply the migration to the database (adds `TodoPriority` enum, `TodoStatus` enum, `todos` table)
3. Regenerate the Prisma client (types for `TodoPriority`, `TodoStatus`, `Todo` model)

---

## 2. Start the Development Server

```bash
# From repo root
yarn dev
# or just the API
cd apps/api && yarn start:dev
```

---

## 3. Verify the New Endpoints

Open Swagger UI at `http://localhost:3000/api/docs` — the `todos` tag should appear with all 6 endpoints.

Quick smoke test (replace `<TOKEN>` with a valid access token):

```bash
# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","priority":"HIGH"}'

# List todos
curl http://localhost:3000/todos \
  -H "Authorization: Bearer <TOKEN>"

# List only active todos
curl "http://localhost:3000/todos?status=ACTIVE" \
  -H "Authorization: Bearer <TOKEN>"

# Promote a block (replace <BLOCK_ID> with a TASK-type block UUID)
curl -X POST http://localhost:3000/todos/from-block/<BLOCK_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"priority":"HIGH"}'
```

---

## 4. Run Unit Tests

```bash
cd apps/api
yarn test
```

New test files:
- `src/todo/todo.service.spec.ts`
- `src/todo/todo.controller.spec.ts`

---

## 5. Rollback (if needed)

```bash
cd apps/api
yarn prisma migrate reset   # WARNING: drops all data in dev — use with caution
```
