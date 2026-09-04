# Code Structure and Conventions

This document defines backend coding rules for the ERP.

## Principles

- Keep modules explicit.
- Keep controllers thin.
- Keep business rules in services.
- Keep database access predictable.
- Keep permissions centralized.
- Keep audit logs for important mutations.
- Keep documentation updated with code.
- Keep Nest, TypeScript, test and build packages on compatible major versions.

## Target Module Structure

Example module:

```text
src/erp/sales/invoices/
  dto/
    create-invoice.dto.ts
    update-invoice.dto.ts
    invoice-query.dto.ts
    invoice-response.dto.ts
  invoices.controller.ts
  invoices.module.ts
  invoices.repository.ts
  invoices.service.ts
  invoices.policy.ts
```

For Prisma projects, entity files are optional because Prisma schema is the main
database model.

## Controller Rules

Controllers should:

- Define routes.
- Use DTOs.
- Use guards/decorators.
- Call services.
- Avoid business logic.
- Avoid direct Prisma/database calls.

Authentication is fail-closed: `JwtAuthGuard` is global. Only login, refresh,
password recovery, health, or other deliberately public routes may use
`@Public()`.

Example:

```ts
@Post()
@RequireAccess({
  systemCode: 2,
  resourceCode: 1000,
  actionCode: 2,
})
create(@CurrentUser() user: CurrentUserDto, @Body() dto: CreateInvoiceDto) {
  return this.invoicesService.create(user, dto);
}
```

## Service Rules

Services should:

- Validate business rules.
- Call policy service when data-level access is needed.
- Use transactions for multi-table writes.
- Write audit logs for important actions.
- Return DTO-ready data.

Services should not:

- Read raw `process.env`.
- Build response wrappers manually.
- Ignore authorization for internal calls.

## Repository Rules

Repositories or Prisma query helpers should:

- Keep common queries reusable.
- Apply soft delete filters.
- Use explicit select/include.
- Avoid returning sensitive fields.

## DTO Rules

DTOs should:

- Use `class-validator`.
- Use `class-transformer` only when needed.
- Separate create, update, query, and response DTOs.
- Never expose password hashes, token hashes, or internal metadata.

Class-validator remains the default for class DTOs. Standard Schema may be
used where a schema-first contract is more appropriate; environment config
currently uses Zod through Nest's `validationSchema` option.

## Nest Metadata Rules

- Create route metadata decorators with `Reflector.createDecorator()`.
- Read metadata by passing the decorator reference to `Reflector`.
- Do not introduce new raw `SetMetadata` string keys.
- Use `import type` when a type-only symbol appears in a decorated class. This
  avoids Rspack/SWC trying to emit runtime decorator metadata for an interface.

## Naming Rules

Files:

```text
create-invoice.dto.ts
update-invoice.dto.ts
invoices.service.ts
invoices.controller.ts
```

Permissions:

```text
2.1000.1 = SALES_INVOICE.READ
2.1000.2 = SALES_INVOICE.CREATE
2.1000.3 = SALES_INVOICE.UPDATE
```

Database columns:

```text
company_id
created_at
deleted_at
```

TypeScript properties:

```text
companyId
createdAt
deletedAt
```

## Delete Rules

Default delete is soft delete:

```text
deleted_at = now()
deleted_by_id = current_user.id
```

Hard delete requires:

- Explicit `HARD_DELETE` permission.
- Audit log.
- Business reason if the table is sensitive.

## Transaction Rules

Use transactions when an operation:

- Writes parent and child rows.
- Updates status and writes audit log.
- Creates invoice from pre-invoice.
- Changes inventory quantity.
- Posts accounting entries.
- Rotates refresh tokens.

## Validation Rules

Use layered validation:

1. DTO validation for shape and simple types.
2. Service validation for business rules.
3. Database constraints for uniqueness and referential integrity.

## Error Codes

Recommended stable codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
DUPLICATE_RESOURCE
INVALID_STATUS_TRANSITION
BUSINESS_RULE_FAILED
CONFLICT
INTERNAL_ERROR
```

Use `HttpExceptionOptions.errorCode` for stable machine-readable codes. Keep
codes in `ErrorCode`, use `MessageKey` for translatable human text, and let
`AllExceptionsFilter` create the HTTP response envelope.

## Testing Rules

Minimum tests for important modules:

- Service unit tests for business rules.
- Policy tests for permission scopes and conditions.
- Repository tests for filters and soft delete behavior.
- E2E tests for critical flows such as login and invoice approval.

Authentication tests must verify generic credential errors, refresh-token
rotation, revoked sessions, OTP attempt limits, and session revocation after a
password reset.

The test runner is Vitest. Use `vi.fn()`, `vi.spyOn()` and the shared aliases in
`vitest.config.mts`. `yarn build` must always include a TypeScript check before
the Rspack bundle.

## Documentation Rules

When adding a module:

1. Create or update a file in `docs/modules`.
2. Add database fields to `docs/database`.
3. Add permissions to `docs/iam`.
4. Add phase notes to `docs/ai` if the implementation plan changes.
