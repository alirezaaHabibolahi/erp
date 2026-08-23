# Current Backend Architecture

This document describes the backend as it exists now. It is not the final ERP
architecture.

## Stack

| Area                  | Current choice                        |
| --------------------- | ------------------------------------- |
| Runtime               | Node.js                               |
| Framework             | NestJS 11                             |
| Language              | TypeScript                            |
| Package manager       | Yarn 1.22.22                          |
| Database              | MongoDB with Mongoose                 |
| Cache/session support | Redis                                 |
| Auth                  | Passport JWT + refresh token sessions |
| API docs              | Swagger                               |
| Validation            | class-validator + Nest ValidationPipe |
| Common library        | `libs/common`                         |

## Main Entry Points

```text
src/main.ts
src/app.module.ts
libs/common/src/modules/common.module.ts
```

`src/main.ts` creates the Nest application, enables CORS, configures Swagger,
adds cookie parsing, global validation, response interception, and exception
filtering.

`src/app.module.ts` imports:

- `ConfigModule`
- `CommonModule`
- `AuthModule`

These modules are imported but currently commented:

- `UsersModule`
- `AccessModule`
- `RoleModule`

`CommonModule` is marked as global and imports many cross-cutting modules:

- Database
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
  access/
  auth/
  config/
  decorators/
  guards/
  role/
  sms/
  strategies/
  types/
  users/
  app.controller.ts
  app.module.ts
  app.service.ts
  main.ts
  swagger.ts

libs/common/src/
  constants/
  context/
  database/
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

Responsibilities:

- Signup by phone
- Login by phone/password
- OTP verification
- Refresh token rotation
- Logout
- JWT token generation
- Refresh token session validation

Current issue:

- All auth controller routes are commented out.
- JWT payload contains role and access names directly, which can become stale.
- Access lists in JWT will become too large for ERP-scale permissions.

### Users

Path: `src/users`

Responsibilities:

- Create user
- List users
- Update current user
- Register user profile info
- Generate OTP and send SMS

Current issue:

- `POST /users` is not guarded.
- Hard delete exists in repository.
- User belongs to one role only in the current model.
- There is no company/branch/department ownership yet.

### Role

Path: `src/role`

Responsibilities:

- Create role
- List roles
- Get role
- Update role
- Delete role

Current issue:

- Module is not enabled in `AppModule`.
- Controller has no guards.
- Role model only contains `fa_name`, `en_name`, and an array of access ids.
- This is not enough for granular ERP access control.

### Access

Path: `src/access`

Responsibilities:

- Create access
- List accesses
- Get access
- Update access
- Delete access

Current issue:

- Module is not enabled in `AppModule`.
- Controller has no guards.
- Access model only contains `fa_name` and `en_name`.
- It does not model subsystem, resource, action, scope, or conditions.

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

- Database connection and model registry
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
  -> language middleware
  -> express-session using Redis
  -> global validation pipe
  -> controller
  -> guard/decorator if route uses it
  -> service
  -> repository
  -> MongoDB model
  -> response interceptor
  -> exception filter if error
```

## Current Access Enforcement

Current guards:

- `JwtAuthGuard`
- `RoleAuthGuard`
- `AccessGuard`
- `RateLimitGuard`

Current decorators:

- `@Roles(...)`
- `@Access(...)`
- `@RateLimit(...)`
- `@CurrentUser()`
- `@ResponseMessage(...)`

Current limitations:

- Role guard checks string role names.
- Access guard checks access strings from `request.user.accesses`.
- There is no scoped data filtering.
- There is no condition evaluation.
- There is no policy service that can be reused by services, queries, and jobs.

## What Should Stay

- NestJS module-based structure
- DTO validation approach
- Swagger integration
- Provider pattern for SMS
- Common reusable services if dependencies become explicit
- Response and exception standardization

## What Should Change

- Replace MongoDB/Mongoose with PostgreSQL/Prisma for target ERP data.
- Move from simple role/access to IAM/RBAC/ABAC.
- Add company, branch, department, and user organization context.
- Add audit logs for security and business actions.
- Add soft delete by default.
- Guard admin endpoints before enabling them.
- Avoid storing large permission arrays inside JWT access tokens.
- Stop using global coupling for every shared service.
