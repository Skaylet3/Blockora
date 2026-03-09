# API Contract Changes: Auth Endpoints with CAPTCHA

## POST /auth/register

**Request body** (changed — `captchaToken` added):
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "displayName": "John",
  "captchaToken": "0.turnstile-token-string"
}
```

**Response 201** (unchanged):
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid-string"
}
```

**New error 403**:
```json
{ "statusCode": 403, "message": "CAPTCHA verification failed" }
```

**New error 503**:
```json
{ "statusCode": 503, "message": "CAPTCHA service unavailable, please retry" }
```

---

## POST /auth/login

**Request body** (changed — `captchaToken` added):
```json
{
  "email": "user@example.com",
  "password": "SecurePass1",
  "captchaToken": "0.turnstile-token-string"
}
```

**Response 200** (unchanged):
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid-string"
}
```

**New error 403**: same as register
**New error 503**: same as register

---

## POST /auth/refresh

**Request body** (changed — `captchaToken` added):
```json
{
  "refreshToken": "uuid-string",
  "captchaToken": "0.turnstile-token-string"
}
```

**Response 200** (unchanged):
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid-string"
}
```

**New error 403**: same as register
**New error 503**: same as register

---

## Unchanged Endpoints

- `POST /auth/logout` — no CAPTCHA (protected by JWT)
- `GET /auth/me` — no CAPTCHA (protected by JWT)
