# AI Implementation Plan

This file is the working roadmap for AI-assisted implementation of the ERP
backend.

Any AI agent or developer continuing this project should read this file before
making code changes.

## Working Rules

- Read the root `README.md` first.
- Read `docs/README.md`.
- Read the relevant architecture, database, IAM, and module docs.
- Do not implement new ERP features on top of the old Mongo role/access model.
- Do not hardcode role checks such as `user.role === 'admin'` for new ERP code.
- Do not store the full permission matrix inside JWT tokens.
- Use PostgreSQL + Prisma for new target data models.
- Keep each phase small enough to build and verify.
- Update docs when code changes.
- Keep unrelated refactors out of implementation phases.

## Phase 0 - Documentation and Current-State Freeze

Goal:

```text
Document the current backend and define the target ERP architecture.
```

Tasks:

- Create backend documentation folder.
- Replace default Nest README with ERP README.
- Document current Mongo models.
- Document target PostgreSQL models.
- Document IAM/RBAC/ABAC.
- Document invoice flow.
- Document coding conventions.

Done when:

- `docs` folder exists.
- README points to all documentation.
- Future phases are clear.

## Phase 1 - PostgreSQL and Prisma Foundation

Goal:

```text
Add the target database foundation without breaking the current code.
```

Tasks:

- Add Prisma dependencies.
- Add PostgreSQL Docker Compose or local setup docs.
- Add `DATABASE_URL` and env validation.
- Create `src/database/prisma.module.ts`.
- Create `src/database/prisma.service.ts`.
- Add initial Prisma schema.
- Add first migration for organization and IAM core tables.
- Add seed script for base actions, scopes, and system permissions.

Initial tables:

```text
companies
branches
departments
users
auth_sessions
subsystems
resources
actions
permissions
scopes
roles
role_permissions
user_roles
user_permission_overrides
audit_logs
```

Done when:

- App builds.
- Prisma client generates.
- Migration runs against local PostgreSQL.
- Seed creates base IAM metadata.

## Phase 2 - IAM Core

Goal:

```text
Move identity and session foundations to PostgreSQL.
```

Tasks:

- Implement users table access through Prisma.
- Implement company/branch/department user context.
- Implement password hash and OTP fields.
- Implement auth sessions with refresh token hash.
- Implement login, refresh, logout.
- Reactivate auth controller routes safely.
- Add tests for login and refresh token rotation.

Done when:

- User can log in.
- Refresh tokens rotate.
- Revoked sessions cannot refresh.
- Inactive users cannot authenticate.

## Phase 3 - Dynamic Permissions and Policy Engine

Goal:

```text
Implement RBAC + ABAC for ERP-level access control.
```

Tasks:

- Implement permission catalog.
- Implement roles.
- Implement role permissions with scope and conditions.
- Implement user roles.
- Implement user permission overrides.
- Implement `PolicyService`.
- Implement `PermissionGuard`.
- Implement `@RequirePermission(...)`.
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

## Phase 9 - Cleanup Old Mongo Layer

Goal:

```text
Remove old Mongo/Mongoose code after PostgreSQL replacement is complete.
```

Tasks:

- Remove Mongoose dependencies.
- Remove old database module.
- Remove old Mongo schemas.
- Remove old repositories.
- Remove old env variables.
- Update docs.

Done when:

- App runs only on PostgreSQL.
- No Mongo imports remain.
- README no longer lists Mongo as current runtime.

## Recommended First Coding Task

Start with:

```text
Phase 1 - PostgreSQL and Prisma Foundation
```

Do not start invoices before IAM and organization foundations exist.
