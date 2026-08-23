# ERP Module Documentation Template

Copy this template when documenting a new ERP module.

## Module Name

Example:

```text
Sales / Invoices
```

## Purpose

Explain what business problem this module solves.

## Location

Target source path:

```text
src/erp/<subsystem>/<resource>
```

Example:

```text
src/erp/sales/invoices
```

## Main Entities

List database tables and important fields.

```text
table_name
  id
  company_id
  branch_id
  ...
```

## Statuses

List business statuses and transitions.

```text
draft -> pending_approval -> approved -> completed
draft -> cancelled
```

## Permissions

List required permission codes.

```text
subsystem.resource.read
subsystem.resource.create
subsystem.resource.update
subsystem.resource.delete
subsystem.resource.approve
```

## API Endpoints

```text
GET    /...
POST   /...
PUT    /...
DELETE /...
```

## Business Rules

- Rule 1.
- Rule 2.
- Rule 3.

## Validation Rules

- Required fields.
- Unique constraints.
- Numeric limits.
- Status-specific validation.

## Audit Events

```text
resource.created
resource.updated
resource.deleted
resource.approved
resource.cancelled
```

## Integration Points

- IAM
- Audit
- Inventory
- Accounting
- Notifications

## Testing Checklist

- Create success.
- Create validation failure.
- Read with scope own/branch/company/all.
- Update allowed status.
- Update forbidden status.
- Delete soft delete.
- Hard delete permission required.
- Audit log written.
