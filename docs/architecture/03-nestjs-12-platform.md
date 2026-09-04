# NestJS 12 Platform Baseline

Status: implemented on the `dev` branch.

This document records the framework migration decisions that future backend
work must preserve unless an architecture decision replaces them.

## Version Baseline

| Component       | Version line |
| --------------- | ------------ |
| NestJS          | 12           |
| Node.js         | 22.22.3      |
| TypeScript      | 6            |
| Rspack          | 2            |
| Vitest          | 5            |
| Zod             | 4            |
| Package manager | Yarn 1.22.22 |

Nest 12 applications can run on Node 20.19+ or Node 22.12+ on the 22.x line.
The Nest schematics used by `nest new`, `nest generate` and `nest upgrade`
need Node 22.22.3+, 24.15+ or 26+. This repository pins Node 22.22.3 in both
`.nvmrc`, `.node-version` and `package.json` so runtime and CLI work use one
version. The repository policy is intentionally stricter than the minimum Nest
application runtime because development and CI both execute the Nest CLI.

## Module Format

Nest 12 framework packages are ESM-only. The ERP application remains CommonJS:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2023"
  }
}
```

Supported Node releases can load Nest's ESM packages from a CommonJS app.
Changing this repository to ESM is a separate migration because it would also
change relative import extensions, Jest/Vitest behavior, scripts and custom
tooling. Do not mix that work into an ERP feature phase.

## Build Pipeline

`nest-cli.json` uses the Nest 12 Rspack builder:

```json
{
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "rspack"
  }
}
```

Rspack uses its built-in SWC loader. The build script performs a full
TypeScript check first so a fast transpiler cannot hide type errors:

```text
tsc -p tsconfig.build.json --noEmit
nest build
```

Required Rspack peers are direct dev dependencies:

```text
@rspack/core
webpack-node-externals
tsconfig-paths-webpack-plugin
```

## Nest 12 Features In Use

### Route diagnostics

Bootstrap enables specificity-based route resolution. Duplicate routes fail
at startup, while potentially shadowed routes produce warnings.

### Graceful shutdown

`app.enableShutdownHooks()` is enabled. Providers that own connections must
close them through Nest lifecycle hooks. Redis initialization runs through
`onModuleInit` instead of an unawaited async constructor call.

### Typed metadata

`@Public()`, `@RequireAccess()`, `@RateLimit()` and `@ResponseMessage()` use
`Reflector.createDecorator()`. Guards and interceptors pass decorator references
to `Reflector`, which keeps metadata values typed.

### Machine-readable errors

Application exceptions set stable codes through
`HttpExceptionOptions.errorCode`. `AllExceptionsFilter` maps that value to the
existing API envelope:

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid username or password."
}
```

Error identifiers live in `ErrorCode`; translated text keys live in
`MessageKey`.

### Standard Schema config

`ConfigModule` validates environment variables with Zod before loading grouped
runtime config. Production startup fails when database, Redis, JWT, OTP or SMS
credentials are missing or use placeholders.

Class-validator remains the DTO strategy. Nest 12 Standard Schema request and
response validation can be evaluated for future schema-first modules, but it
does not replace existing class DTOs automatically.

## Test Pipeline

Vitest replaces Jest because it consumes Nest 12's ESM packages without
transforming framework code back to CommonJS. Unit tests use `vi` for mocks and
spies. The commands are:

```bash
yarn test
yarn test:watch
yarn test:cov
yarn test:e2e
```

## Removed Dependencies

The migration removed packages that had no source integration:

```text
@nestjs/graphql
@nestjs/mapped-types (still arrives through Swagger when needed)
@nestjs/microservices
@nestjs/schedule
amqp-connection-manager
amqplib
joi
nestjs-pino
pino-http
pino-pretty
express (provided by @nestjs/platform-express)
swagger-ui-express (provided through @nestjs/swagger dependencies)
```

`graphql` remains because the active `graphql-request` utility requires it.
Re-add a removed integration only in the phase that implements and documents
its runtime ownership.

## Deferred Nest 12 Options

- Application-wide ESM migration.
- Native `@nestjs/observe` instrumentation and its operational backend.
- Standard Schema DTO validation and response serialization.
- GraphQL, NATS or other microservice transports.
- Mau deployment integration.

These are optional capabilities, not missing migration work.

## Verification

Before merging platform changes, run:

```bash
yarn typecheck
yarn build
yarn test
yarn prisma:validate
```

Use the Node version pinned by the repository before running Nest CLI commands.

## Known Quality Debt

The migration-owned framework, configuration, auth and test files pass ESLint.
The full repository lint command still reports pre-existing unsafe-type findings
and formatting debt in untouched legacy `src` files and `libs/common`
utilities. The repository still type-checks successfully, but that lint cleanup
belongs in a focused hardening phase so behavior is not changed as a side effect
of this framework migration.
