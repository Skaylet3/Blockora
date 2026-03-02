# Quickstart: Validate User Profile Update

**Feature**: 003-profile-update
**Date**: 2026-03-02

Use these steps to manually validate the feature end-to-end after implementation.

---

## Prerequisites

- Local API running: `yarn workspace api dev` (port 3000)
- Local web app running: `yarn workspace web dev` (port 3001 or as configured)
- A registered user account (or register one via the UI)

---

## Step 1: Verify `GET /auth/me` returns `displayName`

```bash
# 1. Log in to get an access token
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}' \
  | jq .

# Expected: { "accessToken": "...", "refreshToken": "..." }

# 2. Call /auth/me with the access token
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>" \
  | jq .

# Expected: { "userId": "...", "email": "...", "displayName": null }
# (null if user was registered without a display name)
```

---

## Step 2: Update display name via `PATCH /users/me`

```bash
curl -s -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice"}' \
  | jq .

# Expected: { "userId": "...", "email": "...", "displayName": "Alice" }
```

---

## Step 3: Verify persistence via `GET /auth/me`

```bash
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>" \
  | jq .

# Expected: { "userId": "...", "email": "...", "displayName": "Alice" }
```

---

## Step 4: Test whitespace trimming

```bash
curl -s -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"   Bob   "}' \
  | jq .displayName

# Expected: "Bob"  (trimmed)
```

---

## Step 5: Test clearing the display name

```bash
curl -s -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"displayName":""}' \
  | jq .displayName

# Expected: null
```

---

## Step 6: Test validation — name too long

```bash
curl -s -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"displayName\":\"$(python3 -c "print('A'*101)")\"}"\
  | jq .

# Expected: HTTP 422 with validation error message
```

---

## Step 7: Validate the frontend UI

1. Open the web app and log in.
2. Navigate to **Profile Settings** (`/profile`).
3. Verify the **Name** field is visible and pre-populated (empty if no name set).
4. Enter a name and click **Save Changes**.
5. Verify a success toast appears.
6. Reload the page — verify the Name field still shows the saved name.
7. Enter a different name and click **Cancel**.
8. Verify the field reverts to the previously saved value with no server request.

---

## Step 8: Verify Swagger documentation

Open `http://localhost:3000/api/docs` and confirm:
- `GET /auth/me` response schema shows `displayName` field.
- `PATCH /users/me` is listed under the `users` tag with correct request/response schemas.
