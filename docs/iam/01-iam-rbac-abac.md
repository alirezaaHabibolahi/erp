# IAM, RBAC, ABAC, and Permission Design

This document defines the target access-control model for the ERP backend.

## Goal

The ERP must support very detailed access control:

```text
User A can read sales invoices only in their own branch.
User B can approve pre-invoices only below a specific amount.
User C can update inventory products but cannot hard delete them.
User D can export accounting reports only for one department.
```

This requires more than simple roles.

## Concepts

### IAM

Identity and Access Management.

Includes:

- Users
- Login
- OTP
- Passwords
- Sessions
- Refresh tokens
- Active/inactive status
- Role assignment
- Permission evaluation

### RBAC

Role-Based Access Control.

Example:

```text
role: sales_manager
permissions:
  sales.invoice.read
  sales.invoice.create
  sales.invoice.update
  sales.pre_invoice.approve
```

### ABAC

Attribute-Based Access Control.

Example:

```text
sales.invoice.approve
scope: branch
conditions:
  maxAmount: 500000000
  statuses: ["pending_approval"]
```

## Permission Code Format

Use this format:

```text
<subsystem>.<resource>.<action>
```

Examples:

```text
sales.invoice.read
sales.invoice.create
sales.invoice.update
sales.invoice.delete
sales.invoice.hard_delete
sales.invoice.approve
sales.pre_invoice.convert_to_invoice
inventory.product.read
inventory.stock_movement.create
iam.role.update
iam.permission.assign
```

Rules:

- Use lowercase.
- Use dots between parts.
- Use snake_case for multi-word parts.
- Never use random strings.
- Every permission code must exist in the `permissions` table.

## Initial Subsystems

```text
iam
organization
sales
inventory
accounting
hr
notifications
audit
```

## Initial Actions

```text
read
create
update
delete
hard_delete
approve
reject
cancel
export
print
lock
unlock
change_status
send_to_tax
convert_to_invoice
assign
revoke
```

## Initial Scopes

| Scope      | Meaning                                         |
| ---------- | ----------------------------------------------- |
| own        | Only records created by or assigned to the user |
| branch     | Records in the user's branch                    |
| department | Records in the user's department                |
| company    | Records in the user's company                   |
| all        | All records available to the system             |
| custom     | Evaluate JSONB conditions                       |

## Condition Examples

Use PostgreSQL JSONB for conditions.

Invoice branch restriction:

```json
{
  "branchId": "$user.branchId"
}
```

Approve only below amount:

```json
{
  "maxAmount": 500000000
}
```

Allow update only for draft invoices:

```json
{
  "status": ["draft"]
}
```

Allow warehouse-specific access:

```json
{
  "allowedWarehouseIds": "$user.warehouseIds"
}
```

Allow work hours only:

```json
{
  "timeRange": {
    "from": "08:00",
    "to": "17:00"
  }
}
```

## Permission Evaluation Order

Recommended order:

1. If user is inactive, deny.
2. If session is revoked, deny.
3. If user is system super admin, allow.
4. Load direct user permission overrides.
5. Apply explicit deny overrides first.
6. Load role permissions.
7. Merge allowed scopes and conditions.
8. Evaluate requested resource and action.
9. Evaluate data scope.
10. Evaluate JSONB conditions.
11. Allow or deny.

Explicit deny should beat allow.

## Route-Level Usage

Target decorator:

```ts
@RequirePermission('sales.invoice.approve')
```

Controller example:

```ts
@Post(':id/approve')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('sales.invoice.approve')
approve(@Param('id') id: string) {
  return this.invoiceService.approve(id);
}
```

## Service-Level Usage

Routes are not enough. Services also need policy checks for data access.

Example:

```ts
const decision = await this.policyService.check(user, {
  permission: 'sales.invoice.update',
  entity: invoice,
});

if (!decision.allowed) {
  throw new ForbiddenException(decision.reason);
}
```

For list endpoints, the policy service should produce a query filter:

```ts
const filter = await this.policyService.buildFilter(user, {
  permission: 'sales.invoice.read',
});
```

Example filters:

```ts
// own
{
  createdById: user.id;
}

// branch
{
  branchId: user.branchId;
}

// company
{
  companyId: user.companyId;
}
```

## Admin Panel Requirements

The admin panel should support:

- Create role.
- Assign permissions to role.
- Pick scope for each permission.
- Add JSON conditions when scope is custom.
- Assign multiple roles to a user.
- Add direct user allow/deny overrides.
- See effective permissions for a user.
- Audit every role/permission change.

## Default Security Rules

- No public role endpoints.
- No public permission endpoints.
- No hard delete without `*.hard_delete`.
- No export without `*.export`.
- No approval without `*.approve`.
- Do not trust frontend-hidden buttons as authorization.
- Backend guards and policy checks are the source of truth.

## Seed Permissions

Minimum seed example:

```text
iam.user.read
iam.user.create
iam.user.update
iam.user.delete
iam.role.read
iam.role.create
iam.role.update
iam.role.delete
iam.permission.read
iam.permission.assign
organization.company.read
organization.branch.read
organization.department.read
sales.customer.read
sales.customer.create
sales.customer.update
sales.pre_invoice.read
sales.pre_invoice.create
sales.pre_invoice.update
sales.pre_invoice.approve
sales.pre_invoice.reject
sales.pre_invoice.convert_to_invoice
sales.invoice.read
sales.invoice.create
sales.invoice.update
sales.invoice.approve
sales.invoice.cancel
sales.invoice.export
sales.invoice.hard_delete
inventory.product.read
inventory.product.create
inventory.product.update
inventory.product.delete
inventory.product.hard_delete
```

## Phase 1 Test Permissions

For the first implementation phase, do not seed the full ERP permission catalog.
Seed only enough metadata to test authentication and authorization.

Recommended Phase 1 seed:

```text
company: Demo Company
branch: Tehran Branch

subsystem:
  test_sales

resource:
  test_invoice

actions:
  read
  create
  approve

scopes:
  own
  branch
  company
  all

permissions:
  test_sales.test_invoice.read
  test_sales.test_invoice.create
  test_sales.test_invoice.approve

roles:
  test_admin
  test_sales_operator
  test_branch_manager
```

Seed users:

```text
test_admin            phone: 09120000001
test_sales_operator   phone: 09120000002
test_branch_manager   phone: 09120000003
```

Default seed password:

```text
Passw0rd!123
```

Override the password with:

```env
SEED_USER_PASSWORD=your_password
```

Example role permission setup:

```text
test_sales_operator:
  test_sales.test_invoice.read      scope: own
  test_sales.test_invoice.create    scope: branch

test_branch_manager:
  test_sales.test_invoice.read      scope: branch
  test_sales.test_invoice.approve   scope: branch

test_admin:
  all test permissions              scope: all
```
