# AI Implementation Plan

This file is the working roadmap for AI-assisted implementation of the ERP
backend.

Any AI agent or developer continuing this project should read this file before
making code changes.

## Working Rules

- Read the root `README.md` first.
- Read `docs/README.md`.
- Read the relevant architecture, database, IAM, and module docs.
- Do not implement new ERP features on top of deleted legacy data-access code.
- Do not hardcode role checks such as `user.role === 'admin'` for new ERP code.
- Do not store the full permission matrix inside JWT tokens.
- Do not reintroduce express-session for API auth; use JWT plus
  `auth_sessions`.
- Do not reintroduce string role decorators such as `@Roles(...)`.
- Keep `src/config/general.ts` limited to active runtime config; add
  feature-specific config only when that feature module is implemented.
- Keep global response, error, validation, and language handling centralized in
  DI-registered providers.
- Use `MessageKey` and `MessageService` for user-facing API messages instead of
  hardcoded controller or guard strings.
- Use PostgreSQL + Prisma for new target data models.
- Keep each phase small enough to build and verify.
- Update docs when code changes.
- Keep unrelated refactors out of implementation phases.
- Use Node.js 22.22.3 or newer on the supported 22.x line for Nest CLI work.
- Keep NestJS 12 packages on the same major and preserve the current CommonJS
  application format until an explicit ESM migration phase is approved.

## Platform Baseline - NestJS 12

Status:

```text
Completed. Nest packages are aligned on v12, TypeScript is v6, builds use a
TypeScript check plus Rspack, tests use Vitest, and environment config uses
Zod through Nest Standard Schema.
```

Implemented decisions:

- CommonJS application format retained.
- Node.js 22.22.3 pinned for full runtime and CLI support.
- Route duplicate/shadow diagnostics enabled.
- Graceful shutdown hooks enabled.
- Route metadata decorators migrated to `Reflector.createDecorator()`.
- Native Nest `errorCode` mapped into the centralized API error envelope.
- Unused Nest GraphQL, microservices, scheduler, Pino, Joi and AMQP packages
  removed.
- Nest native observability deferred until an operational backend is selected.

See [NestJS 12 Platform Baseline](../architecture/03-nestjs-12-platform.md).

## Phase 0 - Documentation and Current-State Freeze

Goal:

```text
Document the current backend and define the target ERP architecture.
```

Tasks:

- Create backend documentation folder.
- Replace default Nest README with ERP README.
- Document the initial database direction.
- Document target PostgreSQL models.
- Document IAM/RBAC/ABAC.
- Document invoice flow.
- Document coding conventions.

Done when:

- `docs` folder exists.
- README points to all documentation.
- Future phases are clear.

## Phase 1 - Auth and Permission Foundation

Status:

```text
Implemented. Prisma schema, first migration, seed data, username/password auth,
JWT sessions, refresh rotation, logout, Redis SMS OTP password reset,
database-backed access evaluation, effective access output, and authorization
test routes are in place.
```

Goal:

```text
Add PostgreSQL + Prisma only for authentication and authorization foundations.
```

This phase must not implement ERP business modules such as invoices, products,
inventory, accounting, or reports. The only business-like data allowed in this
phase is small test metadata needed to verify authorization.

Tasks:

- Add Prisma dependencies. Done.
- Add PostgreSQL Docker Compose or local setup docs. Done.
- Add `DATABASE_URL` and env example. Done.
- Add Prisma 7 `prisma.config.ts` for datasource and migration settings. Done.
- Add PostgreSQL driver adapter for PrismaService. Done.
- Create `libs/common/src/database/postgres/prisma.module.ts`. Done.
- Create `libs/common/src/database/postgres/prisma.service.ts`. Done.
- Add initial Prisma schema for auth and permissions only. Done.
- Add first migration for minimal organization context and IAM tables. Done.
- Add seed script for test company, branches, systems, resources, actions,
  permissions, roles, users, role assignments, and role scopes. Done.
- Standardize global response, error, validation, and language handling. Done.
- Implement username/password login and JWT session runtime. Done.
- Implement atomic refresh rotation and logout. Done.
- Implement phone/SMS OTP password reset with Redis. Done.
- Add protected test routes to verify permission checks. Done.

Initial tables:

```text
companies
branches
users
auth_sessions
systems
resources
actions
permissions
roles
role_permissions
user_roles
user_role_scopes
user_role_scope_branches
user_permission_overrides
user_permission_override_branches
audit_logs
```

Tables intentionally excluded from Phase 1:

```text
departments
customers
products
pre_invoices
pre_invoice_items
invoices
invoice_items
warehouses
stock_movements
accounting_documents
```

Test seed example:

```text
company: Demo Company
branches: Tehran Branch, Shiraz Branch
system: SALES = 2
resources: SALES_INVOICE = 1000, SALES_PROFORMA = 1001, SALES_CENTER = 1003
actions: READ = 1, CREATE = 2, UPDATE = 3, APPROVE = 6
permissions:
  2.1001.1
  2.1001.2
  2.1001.3
  2.1001.6
roles:
  TEST_ADMIN
  SALES_OPERATOR
  BRANCH_MANAGER
```

Done when:

- App builds.
- Prisma client generates.
- Migration runs against local PostgreSQL.
- Seed creates test IAM metadata.
- A user can log in.
- A protected route can allow/deny based on permission.

Implemented files:

```text
package.json
yarn.lock
docker-compose.yml
.env.example
prisma.config.ts
prisma/schema/00-base.prisma
prisma/schema/organization.prisma
prisma/schema/iam.prisma
prisma/schema/audit.prisma
prisma/schema/README.md
prisma/seed.ts
libs/common/src/database/postgres/index.ts
libs/common/src/database/postgres/prisma.module.ts
libs/common/src/database/postgres/prisma.service.ts
libs/common/src/context/request-context.ts
libs/common/src/middlewares/language.middleware.ts
libs/common/src/services/messageService/message.service.ts
libs/common/src/interceptors/response.interceptor.ts
libs/common/src/filters/all-exceptions.filter.ts
libs/common/src/pipe/validation.pipe.ts
src/auth/auth.module.ts
src/auth/auth.controller.ts
src/auth/auth.service.ts
src/auth/auth-session.service.ts
src/auth/password-reset.service.ts
src/auth/strategies/jwt.strategy.ts
```

Useful commands:

```bash
docker compose up -d postgres redis
yarn prisma:validate
yarn prisma:generate
yarn prisma:migrate:dev --name auth_permission_foundation
yarn db:seed
```

## Phase 2 - Auth Runtime and Policy Engine

Status:

```text
Implemented. Authentication runtime, DB-backed access evaluation, global
AccessGuard integration, effective access endpoint, and protected authorization
test routes are unit-tested and smoke-tested against local PostgreSQL/Redis.
```

Goal:

```text
Make authentication and authorization usable in the running NestJS app.
```

Tasks:

- Implement users table access through Prisma. Done for authentication.
- Implement request company/branch context through role assignments and scopes. Done.
- Implement password hash and Redis OTP recovery. Done.
- Implement auth sessions with refresh token hash. Done.
- Implement login, refresh, logout. Done.
- Create auth controller routes safely. Done.
- Mark public auth routes with `@Public()`. Done.
- Register `JwtAuthGuard` globally with fail-closed defaults. Done.
- Implement permission catalog access. Done.
- Implement access policy service. Done.
- Implement `AccessGuard`. Done.
- Implement `@RequireAccess(...)`. Done.
- Add test authorization endpoints. Done.
- Add tests for login and refresh token rotation. Done.
- Add tests for phone/SMS OTP password reset. Done.

Done when:

- User can log in.
- Refresh tokens rotate.
- Revoked sessions cannot refresh.
- Inactive users cannot authenticate.
- Permission-based route allow/deny works.
- Branch-scoped permission can be tested with seed data.

## Phase 3 - Dynamic Permission Administration

Goal:

```text
Make RBAC + ABAC manageable through backend APIs.
```

Tasks:

- Implement permission catalog.
- Implement roles.
- Implement role permissions.
- Implement user roles with `UserRoleScope` and branch lists.
- Implement user permission overrides.
- Add effective permissions endpoint for admin/debugging.
- Audit role and permission changes.

Done when:

- Route-level permission checks work.
- Service-level data scope checks work.
- Explicit deny overrides beat allow.
- Scopes own/branch/department/company/all work.

## Phase 4 - Organization Module

Goal:

```text
Manage company, branch, and department structure.
```

Tasks:

- Implement companies.
- Implement branches.
- Implement departments.
- Add admin permissions.
- Add soft delete.
- Add audit events.
- Add user assignment to branch and department.

Done when:

- A company can be created.
- Branches/departments can be managed.
- Users can be assigned to organization units.
- Permission scopes can use company/branch/department.

## Phase 5 - Sales Foundation

Goal:

```text
Build the first real ERP subsystem: sales.
```

Tasks:

- Implement customers.
- Implement products reference needed by invoices.
- Implement pre-invoices.
- Implement pre-invoice items.
- Implement invoice totals calculation.
- Implement approval flow.
- Implement conversion from pre-invoice to invoice.
- Implement invoice module.
- Implement print/export placeholder permissions.

Done when:

- Sales operator can create pre-invoice.
- Manager can approve based on scope and conditions.
- Approved pre-invoice can convert to invoice.
- Invoice writes audit logs.

## Phase 6 - Inventory Integration

Goal:

```text
Connect sales documents to inventory behavior.
```

Tasks:

- Implement products.
- Implement warehouses.
- Implement stock movements.
- Decide stock strategy: reserve or reduce.
- Integrate invoice issue with stock movement.
- Audit stock changes.

Done when:

- Invoice issue can affect stock according to company settings.
- Inventory changes are auditable.

## Phase 7 - Accounting Integration

Goal:

```text
Prepare financial records from sales and inventory events.
```

Tasks:

- Define chart of accounts.
- Define accounting documents.
- Define debit/credit entries.
- Generate accounting entries from issued invoices.
- Add posting/locking rules.

Done when:

- Issued invoice can create draft accounting document.
- Posting requires permission.
- Posted entries are locked.

## Phase 8 - Operations, Reports, and Import Jobs

Goal:

```text
Make the ERP maintainable in production.
```

Tasks:

- Add audit log search.
- Add import job logs in PostgreSQL.
- Add background jobs.
- Add export permissions.
- Add report endpoints.
- Add health checks.
- Add metrics and structured logs.

Done when:

- Admin can inspect audit logs.
- Imports are tracked.
- Production readiness checks exist.

## Phase 9 - Legacy Data Layer Cleanup

Goal:

```text
Keep the codebase free of deleted legacy data-access assumptions.
```

Status:

```text
Completed early for the database layer. The old database module, schema files,
legacy database dependencies, and old legacy-backed auth/users/role/access
modules have been removed.
```

Tasks:

- Remove legacy database dependencies. Done.
- Remove old database module. Done.
- Remove old schema files. Done.
- Remove old repositories. Done.
- Remove old env variables. Done.
- Update docs. Done.

Done when:

- App runtime uses only PostgreSQL/Prisma for database access.
- No legacy database imports remain.
- README lists PostgreSQL/Prisma as current runtime.

## Recommended First Coding Task

Start with:

```text
Phase 1 - Auth and Permission Foundation
```

Do not start invoices, products, inventory, accounting, or other ERP business
modules before auth and permissions are stable.
