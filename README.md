# ERP Backend

This repository is the backend codebase for a modular ERP system built with
NestJS and TypeScript.

The current codebase is an early backend foundation. It already contains auth,
users, roles, accesses, SMS, Redis, file/excel utilities, and a MongoDB-based
data layer. The target architecture is a PostgreSQL + Prisma ERP backend with a
dynamic IAM/RBAC/ABAC permission system.

## Current Status

- Framework: NestJS 11 + TypeScript
- Package manager: Yarn 1.22.22
- Current database layer: MongoDB/Mongoose
- Target database layer: PostgreSQL + Prisma
- Prisma foundation: added for auth and permission tables only
- Current auth: JWT + refresh token session model
- Current access model: simple role/access list
- Target access model: subsystem/resource/action/scope/condition
- Documentation root: [docs](./docs/README.md)

Important current notes:

- Auth routes in `src/auth/auth.controller.ts` are currently commented out.
- `UsersModule`, `AccessModule`, and `RoleModule` are commented out in
  `src/app.module.ts`.
- `RoleController` and `AccessController` do not have guards if they are enabled.
- MongoDB models exist under `libs/common/src/database/schemas/models`.
- Prisma files exist under `prisma` and `src/database`.
- The new Prisma module is not imported into `AppModule` yet, so the current
  Mongo runtime is not broken while the auth/permission migration is in progress.

## Documentation Map

Read these files before changing architecture or adding ERP modules:

- [Documentation Home](./docs/README.md)
- [Current Backend Architecture](./docs/architecture/01-current-backend.md)
- [Target Backend Architecture](./docs/architecture/02-target-backend-architecture.md)
- [Current MongoDB Models](./docs/database/01-current-mongodb-models.md)
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

The current MongoDB-based runtime needs at least:

```env
PORT=3000

DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp?schema=public
DIRECT_URL=postgresql://erp_user:erp_password@localhost:5432/erp?schema=public

DATABASE_MONGO_URL=mongodb://127.0.0.1:27017
DATABASE_MONGO_NAME=erp
DATABASE_MONGO_USER=
DATABASE_MONGO_PASS=

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=redis://127.0.0.1:6379

SESSION_SECRET=change_me
JWT_SECRET=change_me
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_EXPIRES_IN=1d
JWT_ACCESS_SECRET_EXPIRE_TIME=1d
JWT_REFRESH_SECRET_EXPIRE_TIME=7d

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
