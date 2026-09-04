# Target PostgreSQL and Prisma Schema

This document defines the current target database structure for the ERP backend.

The target database is PostgreSQL. Prisma 7 is the ORM and migration tool.

## Current Implementation Slice

Phase 1 is intentionally limited to authentication and authorization.

Implemented Phase 1 tables:

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

Removed from the target model:

```text
subsystems table
scopes table
company_id on users
branch_id on users
is_super_admin on users
scope_id on role_permissions
```

Scope is now represented by `ScopeType` enum plus `UserRoleScope`.

Phase 1 must not create ERP business tables such as invoices, products,
inventory, accounting, or reports.

Implemented files:

```text
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
docker-compose.yml
.env.example
```

Useful commands:

```bash
yarn prisma:format
yarn prisma:validate
yarn prisma:generate
yarn prisma:migrate:dev --name auth_permission_foundation
yarn db:seed
```

## ID Strategy

All current models use:

```text
String @id @default(cuid())
```

This keeps IDs application-generated and avoids depending on sequential database
IDs.

## Organization Tables

### companies

| Field       | Type        | Notes                    |
| ----------- | ----------- | ------------------------ |
| id          | string      | primary key              |
| name        | string      | display/operational name |
| legal_name  | string      | optional legal name      |
| national_id | string      | unique when present      |
| is_active   | boolean     | default true             |
| settings    | jsonb       | company-level settings   |
| created_at  | timestamptz | required                 |
| updated_at  | timestamptz | required                 |
| deleted_at  | timestamptz | soft delete marker       |

Relations:

```text
branches
roles
user_roles
user_permission_overrides
audit_logs
```

### branches

| Field      | Type        | Notes              |
| ---------- | ----------- | ------------------ |
| id         | string      | primary key        |
| company_id | string      | required           |
| code       | string      | unique per company |
| name       | string      | required           |
| city       | string      | optional           |
| address    | text        | optional           |
| phone      | string      | optional           |
| is_active  | boolean     | default true       |
| created_at | timestamptz | required           |
| updated_at | timestamptz | required           |
| deleted_at | timestamptz | soft delete marker |

Relations:

```text
company
user_role_scope_branches
user_permission_override_branches
```

Users are not directly attached to branches.

## IAM Tables

### users

`User` is identity only.

| Field               | Type        | Notes                                        |
| ------------------- | ----------- | -------------------------------------------- |
| id                  | string      | primary key                                  |
| phone               | string      | globally unique; used for SMS recovery       |
| username            | string      | globally unique login identifier             |
| email               | string      | globally unique when present                 |
| password_hash       | string      | optional column; required for password login |
| first_name          | string      | optional                                     |
| last_name           | string      | optional                                     |
| display_name        | string      | optional                                     |
| avatar_url          | text        | optional                                     |
| is_verified         | boolean     | default false                                |
| is_active           | boolean     | default true                                 |
| settings            | jsonb       | user preferences, not authorization scope    |
| last_login_at       | timestamptz | optional                                     |
| password_changed_at | timestamptz | optional; used to invalidate old sessions    |
| created_at          | timestamptz | required                                     |
| updated_at          | timestamptz | required                                     |
| deleted_at          | timestamptz | soft delete marker                           |

`users` intentionally does not contain `company_id`, `branch_id`, membership, or
`is_super_admin`.

### auth_sessions

| Field              | Type        | Notes                                  |
| ------------------ | ----------- | -------------------------------------- |
| id                 | string      | primary key                            |
| user_id            | string      | required                               |
| refresh_token_hash | string      | unique; plain refresh token not stored |
| device_name        | string      | optional                               |
| ip_address         | string      | optional                               |
| user_agent         | text        | optional                               |
| is_revoked         | boolean     | default false                          |
| revoked_at         | timestamptz | optional                               |
| expires_at         | timestamptz | required                               |
| last_used_at       | timestamptz | optional                               |
| created_at         | timestamptz | required                               |
| updated_at         | timestamptz | required                               |

### systems

Top-level ERP systems.

| Field       | Type        | Notes        |
| ----------- | ----------- | ------------ |
| id          | string      | primary key  |
| code        | integer     | unique       |
| key         | string      | unique       |
| name        | string      | required     |
| description | text        | optional     |
| is_active   | boolean     | default true |
| created_at  | timestamptz | required     |
| updated_at  | timestamptz | required     |

Seed examples:

```text
1  FINANCE
2  SALES
3  INVENTORY
90 IAM
```

### resources

Permission targets inside a system.

| Field       | Type        | Notes                         |
| ----------- | ----------- | ----------------------------- |
| id          | string      | primary key                   |
| system_code | integer     | references `systems.code`     |
| code        | integer     | resource code inside a system |
| key         | string      | enum-style key                |
| name        | string      | display name                  |
| description | text        | optional                      |
| is_active   | boolean     | default true                  |
| created_at  | timestamptz | required                      |
| updated_at  | timestamptz | required                      |

Unique:

```text
system_code + code
system_code + key
```

Seed examples:

```text
2.1000 SALES_INVOICE
2.1001 SALES_PROFORMA
2.1003 SALES_CENTER
```

### actions

| Field       | Type        | Notes        |
| ----------- | ----------- | ------------ |
| id          | string      | primary key  |
| code        | integer     | unique       |
| key         | string      | unique       |
| name        | string      | display name |
| description | text        | optional     |
| is_active   | boolean     | default true |
| created_at  | timestamptz | required     |
| updated_at  | timestamptz | required     |

Seed examples:

```text
1 READ
2 CREATE
3 UPDATE
4 SOFT_DELETE
5 HARD_DELETE
6 APPROVE
7 REJECT
8 CANCEL
9 PRINT
10 EXPORT
11 SUBMIT
```

### permissions

Permission is the stable combination of:

```text
system_code + resource_code + action_code
```

| Field         | Type        | Notes                                  |
| ------------- | ----------- | -------------------------------------- |
| id            | string      | primary key                            |
| system_code   | integer     | required                               |
| resource_code | integer     | required                               |
| action_code   | integer     | required                               |
| key           | string      | unique compact key, e.g. `2.1001.1`    |
| readable_key  | string      | unique readable key                    |
| description   | text        | optional                               |
| is_active     | boolean     | default true                           |
| deprecated_at | timestamptz | optional; prefer deprecate over delete |
| created_at    | timestamptz | required                               |
| updated_at    | timestamptz | required                               |

Unique:

```text
system_code + resource_code + action_code
```

Permission records do not include branch/company scope.

### roles

| Field       | Type        | Notes              |
| ----------- | ----------- | ------------------ |
| id          | string      | primary key        |
| company_id  | string      | required           |
| key         | string      | unique per company |
| name        | string      | required           |
| description | text        | optional           |
| is_system   | boolean     | default false      |
| is_active   | boolean     | default true       |
| created_at  | timestamptz | required           |
| updated_at  | timestamptz | required           |
| deleted_at  | timestamptz | soft delete marker |

Roles are company-scoped. A role contains permissions, not branch rules.

### role_permissions

Join table between role and permission.

| Field         | Type        | Notes       |
| ------------- | ----------- | ----------- |
| id            | string      | primary key |
| role_id       | string      | required    |
| permission_id | string      | required    |
| created_at    | timestamptz | required    |

Unique:

```text
role_id + permission_id
```

Delete behavior:

```text
role delete       -> cascade role_permissions
permission delete -> restrict
```

Operationally, roles and permissions should be deactivated/deprecated instead of
hard deleted.

### user_roles

Assigns a role to a user inside a company.

| Field      | Type        | Notes       |
| ---------- | ----------- | ----------- |
| id         | string      | primary key |
| user_id    | string      | required    |
| role_id    | string      | required    |
| company_id | string      | required    |
| starts_at  | timestamptz | optional    |
| expires_at | timestamptz | optional    |
| created_at | timestamptz | required    |
| updated_at | timestamptz | required    |

Unique:

```text
user_id + role_id + company_id
```

Branch access does not live here; it lives in `user_role_scopes`.

### user_role_scopes

Defines where a user role is valid.

| Field         | Type        | Notes                                          |
| ------------- | ----------- | ---------------------------------------------- |
| id            | string      | primary key                                    |
| user_role_id  | string      | required                                       |
| scope_type    | enum        | ALL, COMPANY, BRANCH, OWN, CUSTOM              |
| system_code   | integer     | optional; narrows this scope to one permission |
| resource_code | integer     | optional; narrows this scope to one permission |
| action_code   | integer     | optional; narrows this scope to one permission |
| conditions    | jsonb       | optional ABAC conditions                       |
| created_at    | timestamptz | required                                       |
| updated_at    | timestamptz | required                                       |

If `system_code/resource_code/action_code` are null, the scope applies to all
permissions in that user role.

### user_role_scope_branches

Normalized branch list for branch-scoped role access.

| Field              | Type   | Notes       |
| ------------------ | ------ | ----------- |
| id                 | string | primary key |
| user_role_scope_id | string | required    |
| branch_id          | string | required    |

Unique:

```text
user_role_scope_id + branch_id
```

### user_permission_overrides

Direct allow/deny exception for one user.

| Field         | Type        | Notes                             |
| ------------- | ----------- | --------------------------------- |
| id            | string      | primary key                       |
| user_id       | string      | required                          |
| company_id    | string      | required                          |
| permission_id | string      | required                          |
| effect        | enum        | ALLOW or DENY                     |
| scope_type    | enum        | ALL, COMPANY, BRANCH, OWN, CUSTOM |
| conditions    | jsonb       | optional                          |
| reason        | text        | optional                          |
| starts_at     | timestamptz | optional                          |
| expires_at    | timestamptz | optional                          |
| created_at    | timestamptz | required                          |
| updated_at    | timestamptz | required                          |

`DENY` overrides must beat role permissions and direct allow overrides.

### user_permission_override_branches

Normalized branch list for branch-scoped overrides.

| Field       | Type   | Notes       |
| ----------- | ------ | ----------- |
| id          | string | primary key |
| override_id | string | required    |
| branch_id   | string | required    |

## Audit Tables

### audit_logs

| Field         | Type        | Notes       |
| ------------- | ----------- | ----------- |
| id            | string      | primary key |
| company_id    | string      | optional    |
| actor_user_id | string      | optional    |
| action        | string      | required    |
| entity_type   | string      | required    |
| entity_id     | string      | optional    |
| old_values    | jsonb       | optional    |
| new_values    | jsonb       | optional    |
| metadata      | jsonb       | optional    |
| ip_address    | string      | optional    |
| user_agent    | text        | optional    |
| request_id    | string      | optional    |
| created_at    | timestamptz | required    |

## Future ERP Business Tables

These are intentionally excluded from Phase 1 and should be introduced only
after auth/authorization is stable:

```text
departments
customers
products
sales_proformas
sales_proforma_items
sales_invoices
sales_invoice_items
warehouses
stock_movements
accounting_documents
accounting_entries
reports
import_jobs
```
