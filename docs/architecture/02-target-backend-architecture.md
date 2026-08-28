# Target Backend Architecture

This document describes the intended ERP backend architecture.

## Architecture Goals

- Modular ERP backend.
- PostgreSQL as the main transactional database.
- Prisma for schema, migrations, and type-safe database access.
- Dynamic permission model that supports role permissions, user overrides,
  scopes, and JSONB conditions.
- Explicit module boundaries.
- Auditable business operations.
- Safe defaults: validation, authorization, soft delete, and logging.

## Target Source Layout

```text
src/
  main.ts
  app.module.ts
  prisma.config.ts

  prisma/
    schema/
      00-base.prisma
      organization.prisma
      iam.prisma
      audit.prisma

  config/
    env.schema.ts
    general.ts

  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    pagination/
    types/

libs/common/src/
  database/
    postgres/
      prisma.module.ts
      prisma.service.ts
      transaction.ts

  iam/
    auth/
    users/
    roles/
    permissions/
    policies/
    sessions/

  organization/
    companies/
    branches/
    departments/

  audit/
    audit-log.module.ts
    audit-log.service.ts

  notifications/
    sms/

  erp/
    sales/
      customers/
      pre-invoices/
      invoices/
    inventory/
      products/
      warehouses/
      stock-movements/
    accounting/
    hr/
```

## Module Boundary Rules

- Controllers only handle HTTP input/output.
- Services own business rules.
- Repositories or Prisma query helpers own database queries.
- Policy checks must happen before business mutations.
- Audit logs must be written for sensitive mutations.
- ERP modules must not directly modify IAM tables.
- IAM modules must not contain ERP business logic.
- Shared utilities must not import business modules.

## Target Request Lifecycle

```text
HTTP request
  -> language and request context
  -> rate limit
  -> validation and transformation
  -> authentication guard
  -> permission/policy guard
  -> controller
  -> application service
  -> domain/service logic
  -> Prisma transaction
  -> audit log
  -> response DTO
```

## Authentication Flow

```text
signup/login
  -> validate credentials or OTP
  -> load active user
  -> create auth session
  -> issue access token and refresh token
  -> store refresh token hash

authenticated request
  -> verify JWT
  -> load current user state if required
  -> attach user context to request

public route
  -> @Public()
  -> skip JwtAuthGuard

refresh
  -> verify refresh token
  -> check current session hash
  -> rotate refresh token
  -> issue new access token

logout
  -> revoke current auth session
```

Access tokens should contain only stable identity claims:

```json
{
  "sub": "user_id",
  "sessionId": "session_id",
  "phone": "09120000001",
  "tokenType": "access"
}
```

Do not store the full permission matrix inside access tokens.

## Authorization Flow

```text
route metadata
  -> required access codes
  -> policy service
  -> load user roles and overrides
  -> resolve permission result
  -> evaluate scope and conditions
  -> allow, deny, or return query filter
```

Example route metadata:

```ts
@RequireAccess({
  systemCode: 2,
  resourceCode: 1000,
  actionCode: 6,
})
```

The policy service should return a structured result:

```ts
type PolicyDecision = {
  allowed: boolean;
  scope: 'OWN' | 'BRANCH' | 'COMPANY' | 'ALL' | 'CUSTOM';
  conditions?: Record<string, unknown>;
  reason?: string;
};
```

## Data Access

Use Prisma as the default data layer.

Guidelines:

- Keep Prisma 7 connection and migration configuration in `prisma.config.ts`.
- Keep Prisma schema split by backend domain under `prisma/schema`.
- Use PostgreSQL driver adapter `@prisma/adapter-pg` when constructing
  `PrismaClient`.
- Use explicit `select` for list endpoints.
- Use transactions for multi-table writes.
- Use soft delete filters by default.
- Use optimistic locking for high-risk records such as invoices.
- Use database constraints for unique business codes.
- Use JSONB only for dynamic conditions or metadata, not for core relational
  ERP data.

## Configuration

Runtime config should stay grouped and minimal:

```text
app
redis
rateLimit
jwt
sms
```

Feature-specific config, such as tax/StuffId, import jobs, storage, or report
export settings, should be introduced only with the module that owns it.

## Auditing

Audit logs are required for:

- Login failures and suspicious auth events
- Role and permission changes
- User activation/deactivation
- Invoice create/update/delete/approve/cancel
- Inventory quantity changes
- Accounting document posting
- Hard delete actions
- Data export actions

Audit log minimum fields:

```text
id
company_id
actor_user_id
action
entity_type
entity_id
old_values
new_values
metadata
ip_address
user_agent
request_id
created_at
```

## Error Handling

Target API errors should be consistent:

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "PERMISSION_DENIED",
  "data": null,
  "errors": null,
  "meta": {
    "requestId": "...",
    "path": "/api/path",
    "method": "POST",
    "timestamp": "2026-08-28T00:00:00.000Z",
    "language": "en",
    "statusCode": 403
  }
}
```

Controllers and services should throw errors with stable `code` values and
translation keys from `MessageKey`. The global exception filter owns HTTP
response shape and language translation. Unknown internal errors must not expose
raw messages in production.

## Success Response

Target API success response:

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

For paginated lists:

```json
{
  "success": true,
  "message": "Successful request.",
  "data": [],
  "meta": {
    "requestId": "...",
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

## Language Handling

The backend should keep a small internal i18n layer until a larger translation
workflow is needed. The active design is:

- Message keys live in `MessageKey`.
- Translation objects live under `libs/common/src/constants/messages`.
- `MessageService` resolves nested message keys and falls back to the default
  language.
- `LanguageMiddleware` detects language from query/header values and stores it
  in async request context.
- Frontend clients can send `X-Language` or `Accept-Language`; backend responses
  expose `Content-Language` and `X-Request-Id`.

## Deployment Services

Target local development services:

```text
app
postgres
redis
```

Optional future services:

```text
rabbitmq
minio
worker
```
