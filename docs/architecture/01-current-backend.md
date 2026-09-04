# Current Backend Architecture

This document describes the backend as it exists now. It is not the final ERP
architecture.

## Stack

| Area             | Current choice                                     |
| ---------------- | -------------------------------------------------- |
| Runtime          | Node.js                                            |
| Framework        | NestJS 11                                          |
| Language         | TypeScript                                         |
| Package manager  | Yarn 1.22.22                                       |
| Database         | PostgreSQL with Prisma 7                           |
| Prisma runtime   | `@prisma/adapter-pg`                               |
| Cache/rate limit | Redis                                              |
| Auth             | Username/password, JWT sessions, SMS reset OTP     |
| API docs         | Swagger                                            |
| Validation       | class-validator + `I18nValidationPipe`             |
| Common library   | `libs/common`                                      |
| API envelope     | Global success interceptor + error filter          |
| Language         | `?lang`, `X-Language`, `X-Lang`, `Accept-Language` |

## Main Entry Points

```text
src/main.ts
src/app.module.ts
libs/common/src/modules/common.module.ts
prisma.config.ts
prisma/schema/
```

`src/main.ts` creates the Nest application, enables CORS, configures Swagger,
and adds cookie parsing.

`src/app.module.ts` imports:

- `ConfigModule`
- `CommonModule`
- `AuthModule`

It also registers global cross-cutting providers through Nest DI:

- `APP_FILTER` -> `AllExceptionsFilter`
- `APP_INTERCEPTOR` -> `ResponseInterceptor`
- `APP_PIPE` -> `I18nValidationPipe`
- `APP_GUARD` -> `RateLimitGuard`
- `APP_GUARD` -> `JwtAuthGuard`

`ConfigModule` loads `src/config/general.ts`, which currently exposes only
current runtime configuration:

```text
app
redis
rateLimit
jwt
sms
```

Legacy StuffId/import-specific config was removed until a real tax/import
module needs it again.

`CommonModule` is marked as global and imports many cross-cutting modules:

- Redis
- SMS
- File
- API
- Zip
- Excel
- Multer
- Image
- Download

## Current Source Layout

```text
src/
  auth/
    dto/
    interfaces/
    strategies/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    auth-session.service.ts
    password-reset.service.ts
  config/
  decorators/
  guards/
  sms/
  types/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  swagger.ts

libs/common/src/
  constants/
  context/
  database/
    postgres/
  decorators/
  dto/
  filters/
  interceptors/
  middlewares/
  modules/
  pipe/
  redis/
  services/
  utils/
```

## Current Modules

### Auth

Path: `src/auth`

Current status:

- Prisma-based username/password login is implemented.
- Access JWTs are linked to database-backed `AuthSession` rows.
- Opaque refresh tokens rotate atomically; only their hashes are persisted.
- Logout revokes the current session.
- Forgot-password uses phone/SMS OTP with Redis TTL, cooldown, and attempt
  limits.
- Password reset revokes all active sessions.
- Public signup is intentionally not implemented.

See [Authentication and Sessions](../iam/02-authentication-and-sessions.md).

### Users

Previous path: `src/users`

Current status:

- Removed.
- User persistence now exists only in the Prisma schema until the new IAM users
  module is implemented.
- The next users module should live under the IAM boundary. `User` is identity
  only; company and branch context must come from role assignments and scopes.

### Role

Previous path: `src/role`

Current status:

- Removed.
- Role persistence now exists only in the Prisma schema until the new IAM roles
  module is implemented.
- New role APIs must support role permissions. User-specific data boundaries
  must be handled by `UserRoleScope`.

### Access

Previous path: `src/access`

Current status:

- Removed.
- Access persistence is replaced by the Prisma permission catalog:
  system/resource/action plus role scopes.
- New permission APIs must be built on the Prisma schema.

### SMS

Path: `src/sms`

Responsibilities:

- Send SMS through provider abstraction.
- Providers include SMS.ir and Kavenegar.

Target direction:

- Move SMS under a `notifications` domain.
- Add queue, retry, provider failover, and message audit logs.

### Common Library

Path: `libs/common`

Responsibilities:

- Prisma module/service under `libs/common/src/database/postgres`
- Prisma 7 datasource and migration settings in `prisma.config.ts`
- Multi-file Prisma schema under `prisma/schema`
- Redis services and locks
- Messages and translations
- Exception filters
- Response interceptors
- File, image, excel, zip, multer, download utilities
- Request context and middlewares

Current issue:

- `CommonModule` is global and imports many modules.
- This makes dependencies convenient but too coupled for a large ERP.
- Target architecture should make module dependencies explicit.

## Current Request Lifecycle

```text
HTTP request
  -> main.ts Nest app
  -> cookie parser
  -> language middleware and request context
  -> global rate-limit guard
  -> global JWT guard unless @Public()
  -> global response interceptor before handler
  -> global validation pipe
  -> controller
  -> service
  -> repository
  -> Prisma model
  -> global response interceptor after handler
  -> exception filter if error
```

## Current Response, Error, and Language Handling

Successful controller returns are wrapped globally:

```json
{
  "success": true,
  "message": "Successful request.",
  "data": {},
  "meta": {
    "requestId": "...",
    "path": "/api/path",
    "method": "GET",
    "timestamp": "2026-08-28T00:00:00.000Z",
    "language": "en",
    "statusCode": 200
  }
}
```

Errors are normalized globally:

```json
{
  "success": false,
  "message": "Validation failed for one or more fields.",
  "code": "VALIDATION_FAILED",
  "data": null,
  "errors": [
    {
      "field": "phone",
      "messages": ["Phone number must be 11 digits and start with 0."]
    }
  ],
  "meta": {
    "requestId": "...",
    "path": "/api/path",
    "method": "POST",
    "timestamp": "2026-08-28T00:00:00.000Z",
    "language": "en",
    "statusCode": 400
  }
}
```

Language is detected in this order:

```text
?lang
X-Language
X-Lang
Accept-Language
DEFAULT_LANGUAGE
```

Supported languages currently live in `libs/common/src/constants/messages`.
Adding a new language should require adding the translation file and including
it in `select-language.ts`. The request middleware stores language and
requestId in `RequestContext`, sets `Content-Language`, and returns
`X-Request-Id`.

## Current Access Enforcement

Current guards:

- `JwtAuthGuard`
- `AccessGuard`
- `RateLimitGuard`

Current decorators:

- `@Public()`
- `@RequireAccess(...)`
- `@RateLimit(...)`
- `@CurrentUser()`
- `@ResponseMessage(...)`

Current limitations:

- String role guards and decorators were removed.
- Access guard now reads `@RequireAccess(...)` metadata, but the database-backed
  permission evaluation service is not implemented yet.
- There is no scoped data filtering.
- There is no condition evaluation.
- There is no policy service that can be reused by services, queries, and jobs.
- Authentication is usable, but authorization routes still wait for the policy
  engine.

## What Should Stay

- NestJS module-based structure
- DTO validation approach
- Swagger integration
- Provider pattern for SMS
- Common reusable services if dependencies become explicit
- Response and exception standardization
- Centralized message translation through `MessageService`

## What Should Change

- Continue building Prisma modules for target ERP data.
- Move from simple role/access to IAM/RBAC/ABAC.
- Resolve company and branch context through `UserRole` and `UserRoleScope`.
- Add audit logs for security and business actions.
- Add soft delete by default.
- Guard admin endpoints before enabling them.
- Avoid storing large permission arrays inside JWT access tokens.
- Stop using global coupling for every shared service.
- Keep API response, error, and language handling centralized and DI-based.
