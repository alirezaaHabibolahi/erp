# Current MongoDB Models

The current backend uses MongoDB/Mongoose models under:

```text
libs/common/src/database/schemas/models
```

This document captures the current database shape before the PostgreSQL/Prisma
migration.

## Database Connection

Current database module:

```text
libs/common/src/database/db.module.ts
```

Environment variables:

```env
DATABASE_MONGO_URL=
DATABASE_MONGO_NAME=
DATABASE_MONGO_USER=
DATABASE_MONGO_PASS=
```

The current database module connects to MongoDB and exposes a `ModelService`
provider.

## User

Model file:

```text
libs/common/src/database/schemas/models/user.model.ts
```

Collection:

```text
users
```

Fields:

| Field                | Type     | Notes                                         |
| -------------------- | -------- | --------------------------------------------- |
| phone                | string   | required, unique                              |
| username             | string   | unique                                        |
| email                | string   | unique, sparse                                |
| first_name           | string   | optional                                      |
| last_name            | string   | optional                                      |
| otp_code             | string   | optional                                      |
| expire_otp_code_date | Date     | optional                                      |
| password             | string   | hashed password                               |
| is_verified          | boolean  | default false                                 |
| is_admin             | boolean  | default false                                 |
| role                 | ObjectId | ref `roles`, required                         |
| is_active            | boolean  | default true                                  |
| settings             | object   | default `{}`                                  |
| deletedAt            | Date     | soft delete marker, not consistently enforced |
| createdAt            | Date     | timestamps                                    |
| updatedAt            | Date     | timestamps                                    |

Current limitations:

- User belongs to only one role.
- No company, branch, department, or employee profile relation.
- `deletedAt` exists but repository still has hard delete methods.

## Role

Model file:

```text
libs/common/src/database/schemas/models/role.model.ts
```

Collection:

```text
roles
```

Fields:

| Field     | Type       | Notes                       |
| --------- | ---------- | --------------------------- |
| fa_name   | string     | required                    |
| en_name   | string     | required, unique, lowercase |
| accesses  | ObjectId[] | refs `access`               |
| createdAt | Date       | timestamps                  |
| updatedAt | Date       | timestamps                  |

Current limitations:

- Role permissions do not have scope.
- Role permissions do not have conditions.
- Role permissions do not distinguish subsystem/resource/action structurally.

## Access

Model file:

```text
libs/common/src/database/schemas/models/access.model.ts
```

Collection:

```text
accesses
```

Fields:

| Field     | Type   | Notes            |
| --------- | ------ | ---------------- |
| fa_name   | string | required         |
| en_name   | string | required, unique |
| createdAt | Date   | timestamps       |
| updatedAt | Date   | timestamps       |

Current limitations:

- Access is only a named string.
- No canonical permission code format is enforced.
- No relation to subsystem, resource, action, or scope.

## TokenSession

Model file:

```text
libs/common/src/database/schemas/models/token-session.model.ts
```

Collection:

```text
token_sessions
```

Fields:

| Field            | Type     | Notes                |
| ---------------- | -------- | -------------------- |
| userId           | ObjectId | ref `user`, required |
| refreshTokenHash | string   | required             |
| expiresAt        | Date     | required, TTL index  |
| isValid          | boolean  | default true         |
| lastUsedAt       | Date     | optional             |
| revokedAt        | Date     | optional             |
| createdAt        | Date     | timestamps           |
| updatedAt        | Date     | timestamps           |

Current notes:

- Unique index on `userId` means one active session per user.
- Future ERP may need multi-device sessions.

## Product

Model file:

```text
libs/common/src/database/schemas/models/product.model.ts
```

Collection:

```text
products
```

Fields:

| Field           | Type    | Notes                         |
| --------------- | ------- | ----------------------------- |
| ID              | string  | required                      |
| DescriptionOfID | string  | required                      |
| VAT             | number  | default 0                     |
| Taxable         | string  | default imported source value |
| RunDate         | Date    | optional                      |
| ExpirationDate  | Date    | optional                      |
| Type            | string  | optional                      |
| CreateDate      | Date    | required                      |
| LastEditDate    | Date    | required                      |
| importBatch     | string  | required                      |
| importDate      | Date    | default now                   |
| sourceFile      | string  | required                      |
| deletedAt       | Date    | soft delete marker            |
| isActive        | boolean | default true                  |
| activatedAt     | Date    | default now                   |
| deactivatedAt   | Date    | optional                      |

Indexes:

- `ID`
- `RunDate`
- `ExpirationDate`
- `Type`
- `importBatch`

Current notes:

- This model looks imported from the tax/stuff-id domain.
- Field names should be normalized when moving to PostgreSQL.

## ImportLog

Model file:

```text
libs/common/src/database/schemas/models/import-log.model.ts
```

Collection:

```text
import_logs
```

Fields:

| Field            | Type    | Notes                                               |
| ---------------- | ------- | --------------------------------------------------- |
| jobType          | string  | midnight, daily, periodic, weekly-full-sync, manual |
| status           | string  | success, failed, partial, in_progress               |
| startTime        | Date    | required                                            |
| endTime          | Date    | required                                            |
| duration         | number  | required                                            |
| totalFiles       | number  | default 0                                           |
| filesProcessed   | number  | default 0                                           |
| filesFailed      | number  | default 0                                           |
| totalRecords     | number  | default 0                                           |
| recordsInserted  | number  | default 0                                           |
| recordsFailed    | number  | default 0                                           |
| files            | array   | file-level processing stats                         |
| processingTime   | number  | required                                            |
| recordsPerSecond | number  | default 0                                           |
| memoryUsageMB    | number  | default 0                                           |
| hasErrors        | boolean | default false                                       |
| errorDetails     | array   | file, message, timestamp                            |
| totalErrors      | number  | default 0                                           |
| batchId          | string  | required                                            |
| serverInfo       | object  | host, platform, node, memory                        |
| deletedAt        | Date    | soft delete marker                                  |

Current notes:

- This is useful for import jobs.
- It should not replace a general ERP audit log.

## Migration Notes

When moving to PostgreSQL:

- Convert Mongo `_id` references to UUID or CUID primary keys.
- Normalize field names to `snake_case` in the database or consistent Prisma
  names with `@map`.
- Replace role/access arrays with join tables.
- Add company/branch/department relations.
- Replace hard deletes with soft deletes unless a hard delete permission exists.
- Move dynamic permission conditions to `JSONB`.
- Add audit logs before enabling sensitive admin endpoints.
