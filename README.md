# ERP Backend

This repository is the backend codebase for a modular ERP system built with
NestJS and TypeScript.

The current codebase is an early backend foundation. It keeps SMS, Redis,
file/excel utilities, and a PostgreSQL + Prisma data layer. The old
auth/users/roles/accesses runtime was removed and will be rebuilt on the Prisma
IAM foundation. The target architecture is a PostgreSQL + Prisma ERP backend
with a dynamic IAM/RBAC/ABAC permission system.

## Current Status

- Framework: NestJS 11 + TypeScript
- Package manager: Yarn 1.22.22
- Database layer: PostgreSQL + Prisma
- Prisma version: 7.10.0 with `prisma.config.ts` and PostgreSQL driver adapter
- Prisma foundation: added for auth and permission tables only
- Current auth runtime: old implementation removed; Prisma-based auth is next
- Current access runtime: old implementation removed; Prisma-based permissions are next
- Target access model: subsystem/resource/action/scope/condition
- Documentation root: [docs](./docs/README.md)

Important current notes:

- Old auth/users/role/access modules were removed because they depended on the
  deleted legacy data layer.
- `src/auth` currently only keeps reusable DTOs for the next auth runtime.
- Prisma schema files exist under `prisma/schema`; Nest database services live
  under `libs/common/src/database/postgres`.
- Prisma 7 reads database connection settings from `prisma.config.ts`; the
  datasource block in `prisma/schema/00-base.prisma` only defines the provider.
- The Prisma module is not imported into `AppModule` yet. It should be imported
  by the new Prisma-based IAM modules as they are implemented.

## Documentation Map

Read these files before changing architecture or adding ERP modules:

- [Documentation Home](./docs/README.md)
- [Current Backend Architecture](./docs/architecture/01-current-backend.md)
- [Target Backend Architecture](./docs/architecture/02-target-backend-architecture.md)
- [Target PostgreSQL and Prisma Schema](./docs/database/02-target-postgresql-prisma-schema.md)
- [IAM, RBAC, ABAC, Permissions](./docs/iam/01-iam-rbac-abac.md)
- [ERP Module Documentation Template](./docs/modules/00-module-template.md)
- [Sales Invoice Flow](./docs/modules/01-sales-invoice-flow.md)
- [Code Structure and Conventions](./docs/standards/01-code-structure-and-conventions.md)
- [AI Implementation Plan](./docs/ai/01-ai-implementation-plan.md)

## Local Setup

Install dependencies:

```bash
yarn install
```

Start local infrastructure:

```bash
docker compose up -d postgres redis
```

Generate Prisma client:

```bash
yarn prisma:generate
```

Create and run the first PostgreSQL migration:

```bash
yarn prisma:migrate:dev --name auth_permission_foundation
```

Seed test auth/permission data:

```bash
yarn db:seed
```

Run in development mode:

```bash
yarn start:dev
```

If Windows/Yarn cannot resolve the local Nest binary, use:

```bash
yarn run nest start --watch
```

Build:

```bash
yarn build
```

Run tests:

```bash
yarn test
```

## Required Environment Variables

The current PostgreSQL/Prisma runtime needs at least:

```env
PORT=3000
TRUST_PROXY=false
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp?schema=public

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=redis://127.0.0.1:6379
RATE_LIMIT_MAX=100
RATE_LIMIT_TTL_SECONDS=60

JWT_ACCESS_SECRET=replace_me_with_at_least_32_chars_access_secret
JWT_REFRESH_SECRET=replace_me_with_at_least_32_chars_refresh_secret
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d

SMS_PROVIDER=smsir

SEED_USER_PASSWORD=Passw0rd!123
```

Target PostgreSQL variables are documented in
[Target PostgreSQL and Prisma Schema](./docs/database/02-target-postgresql-prisma-schema.md).

## Development Direction

The recommended order is:

1. Build Auth, roles, permissions, scopes, and policy guard on the Prisma
   foundation.
2. Verify authentication and authorization with test protected routes.
3. Keep small test organization data such as company, branch, subsystem, resource,
   action, permission, and role.
4. Start ERP business modules only after auth and permissions are stable.

The detailed phased plan is in
[AI Implementation Plan](./docs/ai/01-ai-implementation-plan.md).
