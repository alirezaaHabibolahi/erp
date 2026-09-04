# ERP Backend

This repository is the backend codebase for a modular ERP system built with
NestJS and TypeScript.

The current codebase is an early backend foundation. It keeps SMS, Redis,
file/excel utilities, and a PostgreSQL + Prisma data layer. Username/password
authentication, JWT access tokens, rotating refresh sessions, and SMS OTP
password recovery are implemented on the Prisma IAM foundation. The target
authorization architecture is a dynamic IAM/RBAC/ABAC permission system.

## Current Status

- Framework: NestJS 12 + TypeScript 6
- Recommended Node.js: 22.22.3 (see `.nvmrc` and `.node-version`)
- Build: explicit TypeScript check followed by Rspack
- Tests: Vitest 5
- Package manager: Yarn 1.22.22
- Database layer: PostgreSQL + Prisma
- Prisma version: 7.10.0 with `prisma.config.ts` and PostgreSQL driver adapter
- Prisma foundation: auth, organization context, permission, and audit tables
- Current auth runtime: username/password login, JWT, session rotation/logout,
  and phone/SMS OTP password reset
- Current access runtime: policy evaluation and permission guard are next
- Target access model: subsystem/resource/action/scope/condition
- API shape: centralized success/error envelopes with requestId and language metadata
- Documentation root: [docs](./docs/README.md)

Important current notes:

- Old auth/users/role/access modules were removed because they depended on the
  deleted legacy data layer. `src/auth` is now the Prisma-based auth runtime.
- Prisma schema files exist under `prisma/schema`; Nest database services live
  under `libs/common/src/database/postgres`.
- Prisma 7 reads database connection settings from `prisma.config.ts`; the
  datasource block in `prisma/schema/00-base.prisma` only defines the provider.
- `AuthModule` imports the Prisma, Redis, Passport/JWT, and SMS dependencies.
- `JwtAuthGuard` is global; routes are private unless marked with `@Public()`.
- Global response, error, validation, and language handling are registered in
  `AppModule` through Nest DI providers.
- Nest 12 route conflict diagnostics, native exception error codes, graceful
  shutdown, typed reflection decorators, and Standard Schema env validation
  are enabled.

## Documentation Map

Read these files before changing architecture or adding ERP modules:

- [Documentation Home](./docs/README.md)
- [Current Backend Architecture](./docs/architecture/01-current-backend.md)
- [Target Backend Architecture](./docs/architecture/02-target-backend-architecture.md)
- [NestJS 12 Platform Baseline](./docs/architecture/03-nestjs-12-platform.md)
- [Target PostgreSQL and Prisma Schema](./docs/database/02-target-postgresql-prisma-schema.md)
- [IAM, RBAC, ABAC, Permissions](./docs/iam/01-iam-rbac-abac.md)
- [Authentication and Sessions](./docs/iam/02-authentication-and-sessions.md)
- [ERP Module Documentation Template](./docs/modules/00-module-template.md)
- [Sales Invoice Flow](./docs/modules/01-sales-invoice-flow.md)
- [Code Structure and Conventions](./docs/standards/01-code-structure-and-conventions.md)
- [AI Implementation Plan](./docs/ai/01-ai-implementation-plan.md)

## Local Setup

Install dependencies:

```bash
yarn install
```

Use Node.js 22.22.3 or newer on the supported 22.x line before running Nest
CLI commands. The runtime can load Nest 12 on Node 22.12+, but `nest generate`
and `nest upgrade` require the newer CLI toolchain. The repository pins the
recommended version in `.nvmrc` and `.node-version`.

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

Build:

```bash
yarn build
```

Run tests:

```bash
yarn test
```

Type-check without bundling:

```bash
yarn typecheck
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
AUTH_PASSWORD_RESET_OTP_SECRET=replace_me_with_at_least_32_chars_otp_secret
JWT_ISSUER=erp-backend
JWT_AUDIENCE=erp-client
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d

AUTH_PASSWORD_RESET_OTP_LENGTH=6
AUTH_PASSWORD_RESET_OTP_TTL_SECONDS=120
AUTH_PASSWORD_RESET_OTP_COOLDOWN_SECONDS=60
AUTH_PASSWORD_RESET_OTP_MAX_ATTEMPTS=5

SMS_PROVIDER=smsir
SMS_IR_API_KEY=
KAVENEGAR_API_KEY=
SMS_PASSWORD_RESET_TEMPLATE_ID=
SMS_PASSWORD_RESET_TEMPLATE_NAME=erp-password-reset

SEED_USER_PASSWORD=Passw0rd!123
```

Target PostgreSQL variables are documented in
[Target PostgreSQL and Prisma Schema](./docs/database/02-target-postgresql-prisma-schema.md).

## Development Direction

The recommended order is:

1. Build the role/permission/scope policy service and permission guard on the
   working authentication foundation.
2. Verify authorization with protected test routes.
3. Keep small test organization data such as company, branch, subsystem, resource,
   action, permission, and role.
4. Start ERP business modules only after auth and permissions are stable.

The detailed phased plan is in
[AI Implementation Plan](./docs/ai/01-ai-implementation-plan.md).
