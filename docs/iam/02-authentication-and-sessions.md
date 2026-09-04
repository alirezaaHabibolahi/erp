# Authentication and Session Runtime

Status: implemented and unit-tested.

This document describes the current authentication runtime. Authorization
through roles, permissions, and scopes is documented separately and is the next
implementation step.

## Decisions

- Interactive login uses `username` and `password`.
- Password recovery uses `phone` and an SMS OTP.
- There is no public signup endpoint. ERP users are provisioned by a future
  IAM administration workflow or by the development seed.
- Access tokens are short-lived JWTs.
- Refresh tokens are opaque random values. Only their SHA-256 hashes are stored.
- Every login creates an `auth_sessions` row.
- Routes are protected by default through a global `JwtAuthGuard`; public routes
  must explicitly use `@Public()`.
- The JWT does not contain roles, permissions, company ids, or branch ids.

## Source Layout

```text
src/auth/
  dto/
    forgot-password.dto.ts
    login-request.dto.ts
    login-response.dto.ts
    refresh-token.dto.ts
    reset-password.dto.ts
  interfaces/
    auth-request-context.interface.ts
  strategies/
    jwt.strategy.ts
  auth.controller.ts
  auth.module.ts
  auth.service.ts
  auth-session.service.ts
  password-reset.service.ts
```

## HTTP Endpoints

| Method | Path                    | Public | Purpose                              |
| ------ | ----------------------- | ------ | ------------------------------------ |
| POST   | `/auth/login`           | yes    | Login with username and password     |
| POST   | `/auth/refresh`         | yes    | Rotate refresh token                 |
| POST   | `/auth/logout`          | no     | Revoke the current session           |
| GET    | `/auth/me`              | no     | Return the current safe user profile |
| POST   | `/auth/forgot-password` | yes    | Request an SMS password-reset OTP    |
| POST   | `/auth/reset-password`  | yes    | Reset password with phone and OTP    |

All endpoints use the global success/error envelope and language middleware.

## Login Flow

```text
username + password
  -> trim and lowercase username
  -> load User by unique username
  -> reject missing, inactive, or soft-deleted user
  -> compare password with bcrypt hash
  -> generate opaque refresh token
  -> store only refresh token hash in AuthSession
  -> sign short-lived access JWT
  -> update users.last_login_at
```

Login deliberately returns the same `AUTH_INVALID_CREDENTIALS` error for an
unknown username and a wrong password.

Example request:

```json
{
  "username": "test_admin",
  "password": "Passw0rd!123"
}
```

The response data contains:

```json
{
  "accessToken": "jwt",
  "refreshToken": "opaque-random-token",
  "sessionId": "session-id",
  "userId": "user-id",
  "username": "test_admin",
  "phone": "09120000001"
}
```

## Access Token and Guard

The access JWT contains only stable authentication claims:

```json
{
  "sub": "user-id",
  "sessionId": "session-id",
  "username": "test_admin",
  "phone": "09120000001",
  "tokenType": "access"
}
```

`JwtStrategy` verifies the JWT signature and expiration, then checks the
database session and current user state. A revoked or expired session, inactive
user, or soft-deleted user is rejected even if the JWT has not expired yet.

## Refresh and Logout

Refresh requires both `sessionId` and the opaque `refreshToken`. Rotation uses a
conditional `updateMany` on the current refresh-token hash, so two concurrent
requests cannot both rotate the same token successfully.

Logout sets `is_revoked` and `revoked_at` on the current session. Password reset
revokes every active session for the user.

## Password Reset by SMS OTP

Request flow:

```text
phone
  -> return the same generic response for existing and missing users
  -> enforce per-phone Redis cooldown
  -> generate OTP with node:crypto randomInt
  -> store only a peppered SHA-256 OTP hash in Redis
  -> send OTP through the configured SMS provider
```

Verification flow:

```text
phone + otpCode + password + confirmPassword
  -> atomically increment/check attempts in Redis
  -> timing-safe hash comparison
  -> bcrypt-hash the new password
  -> update User and revoke sessions in one Prisma transaction
  -> delete OTP, attempts, and cooldown keys
```

Redis keys:

```text
auth:password-reset:otp:<phone>
auth:password-reset:attempts:<phone>
auth:password-reset:cooldown:<phone>
```

OTP records are intentionally not stored in PostgreSQL. Redis provides TTL,
cooldown, and attempt counters for short-lived verification state.

## Rate Limits

| Endpoint        | Limit                |
| --------------- | -------------------- |
| login           | 10 requests / 5 min  |
| refresh         | 30 requests / 1 min  |
| forgot-password | 5 requests / 15 min  |
| reset-password  | 10 requests / 15 min |

The global rate-limit guard keys these limits by caller IP and endpoint. The
forgot-password service additionally applies a per-phone cooldown.

## Configuration

```env
JWT_ACCESS_SECRET=
JWT_ISSUER=erp-backend
JWT_AUDIENCE=erp-client
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d

AUTH_PASSWORD_RESET_OTP_SECRET=
AUTH_PASSWORD_RESET_OTP_LENGTH=6
AUTH_PASSWORD_RESET_OTP_TTL_SECONDS=120
AUTH_PASSWORD_RESET_OTP_COOLDOWN_SECONDS=60
AUTH_PASSWORD_RESET_OTP_MAX_ATTEMPTS=5

SMS_PROVIDER=smsir
SMS_IR_API_KEY=
KAVENEGAR_API_KEY=
SMS_PASSWORD_RESET_TEMPLATE_ID=
SMS_PASSWORD_RESET_TEMPLATE_NAME=erp-password-reset
```

Production startup rejects missing or placeholder authentication secrets. SMS
provider credentials and the provider-specific template must be configured
before password-reset delivery can succeed.

## Verification

Unit tests cover login behavior, session hash storage, atomic refresh rotation,
unknown-phone privacy, hashed OTP storage, password reset, and session
revocation. Database/Redis/SMS integration still requires local infrastructure
and provider credentials.

## Next Step

Implement `PolicyService`, database-backed access evaluation,
`@RequireAccess(...)`, and protected authorization test routes. Authentication
must stay separate from company, branch, role, and permission evaluation.
