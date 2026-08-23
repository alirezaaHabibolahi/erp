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

  config/
    env.schema.ts
    general.ts

  database/
    prisma.module.ts
    prisma.service.ts
    transaction.ts

  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    pagination/
    types/

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
  "companyId": "company_id",
  "sessionId": "session_id",
  "isAdmin": false
}
```

Do not store the full permission matrix inside access tokens.

## Authorization Flow

```text
route metadata
  -> required permission code
  -> policy service
  -> load user roles and overrides
  -> resolve permission result
  -> evaluate scope and conditions
  -> allow, deny, or return query filter
```

Example route metadata:

```ts
@RequirePermission('sales.invoice.approve')
```

The policy service should return a structured result:

```ts
type PolicyDecision = {
  allowed: boolean;
  scope: 'own' | 'branch' | 'department' | 'company' | 'all' | 'custom';
  conditions?: Record<string, unknown>;
  reason?: string;
};
```

## Data Access

Use Prisma as the default data layer.

Guidelines:

- Use explicit `select` for list endpoints.
- Use transactions for multi-table writes.
- Use soft delete filters by default.
- Use optimistic locking for high-risk records such as invoices.
- Use database constraints for unique business codes.
- Use JSONB only for dynamic conditions or metadata, not for core relational
  ERP data.

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
before
after
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
  "details": {},
  "requestId": "..."
}
```

## Success Response

Target API success response:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

For paginated lists:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

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
