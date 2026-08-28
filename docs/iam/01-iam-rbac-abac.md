# IAM, RBAC, ABAC, and Permission Design

This document defines the target access-control model for the ERP backend.

## Core Decision

Users are identity records only.

`User` must not contain:

```text
companyId
branchId
isSuperAdmin
membership
```

Access is derived from role assignments and scopes:

```text
User -> UserRole -> Role -> RolePermission -> Permission
                 -> UserRoleScope -> UserRoleScopeBranch
```

## Concepts

### IAM

Identity and Access Management.

Includes users, login, OTP/passwords, sessions, refresh tokens, role
assignment, permission evaluation, and audit.

### RBAC

Role-Based Access Control answers:

```text
Which permissions does this role have?
```

Example:

```text
Role: SALES_OPERATOR
Permissions:
  2.1001.1 = SALES_PROFORMA.READ
  2.1001.2 = SALES_PROFORMA.CREATE
```

### ABAC

Attribute-Based Access Control answers:

```text
Where and under which conditions is this permission valid?
```

Example:

```text
Permission: 2.1001.3 = SALES_PROFORMA.UPDATE
Scope: OWN
Branches: Tehran
Conditions:
  maxAmount: 500000000
```

## Numeric Permission Format

Use this machine format:

```text
<systemCode>.<resourceCode>.<actionCode>
```

Example:

```text
2.1001.1
```

Meaning:

```text
systemCode: 2      = SALES
resourceCode: 1001 = SALES_PROFORMA
actionCode: 1      = READ
```

The readable equivalent is stored too:

```text
SALES_PROFORMA.READ
```

Branch, company, warehouse, sales center, and fiscal year must not be embedded
inside the permission key. They are scopes/conditions, not permissions.

## Initial System Codes

```text
1  FINANCE
2  SALES
3  INVENTORY
90 IAM
```

## Initial Resource Codes

```text
1000 SALES_INVOICE
1001 SALES_PROFORMA
1003 SALES_CENTER
```

Resource codes are grouped by ERP system. A future shared contracts package
will expose these constants to backend and frontend.

## Initial Action Codes

```text
1  READ
2  CREATE
3  UPDATE
4  SOFT_DELETE
5  HARD_DELETE
6  APPROVE
7  REJECT
8  CANCEL
9  PRINT
10 EXPORT
11 SUBMIT
```

Source code must use named constants/enums later, not raw numbers scattered
inside controllers and services.

## Scope Types

| Scope   | Meaning                                                    |
| ------- | ---------------------------------------------------------- |
| ALL     | Global/system-level access. Use rarely.                    |
| COMPANY | All allowed records inside the assigned company.           |
| BRANCH  | Records inside selected branches.                          |
| OWN     | Records created by or assigned to the current user.        |
| CUSTOM  | JSON conditions decide access, such as amount/status/year. |

`OWN` can still be branch-bound. Example:

```text
Ali can UPDATE proformas he owns in Tehran.
Ali can READ all proformas in Shiraz.
```

This is stored as two `UserRoleScope` records.

## Model Responsibilities

```text
User
  Identity only: phone, username, email, password hash, profile, status.

Company
  Legal/tenant context.

Branch
  Operational location under a company.

System
  Top-level ERP system such as SALES or FINANCE.

Resource
  Permission target inside a system, such as SALES_PROFORMA.

Action
  Operation such as READ, CREATE, UPDATE, APPROVE.

Permission
  Stable combination of systemCode + resourceCode + actionCode.

Role
  Company-scoped permission group.

RolePermission
  Join table between Role and Permission.

UserRole
  Assigns a role to a user inside a company.

UserRoleScope
  Defines where a UserRole is valid.

UserRoleScopeBranch
  Normalized branch list for branch-scoped access.

UserPermissionOverride
  Direct allow/deny exception for a user.
```

## Example

Ali is a sales operator in Demo Company.

```text
UserRole:
  Ali -> SALES_OPERATOR -> Demo Company

RolePermission:
  SALES_OPERATOR -> 2.1001.1
  SALES_OPERATOR -> 2.1001.2
  SALES_OPERATOR -> 2.1001.3

UserRoleScope:
  2.1001.3 -> OWN -> Tehran
  2.1001.1 -> BRANCH -> Shiraz
  2.1001.2 -> BRANCH -> Tehran, Shiraz
```

Result:

```text
Ali can update only his own proformas in Tehran.
Ali can read all proformas in Shiraz.
Ali can create proformas in Tehran and Shiraz.
```

## Route-Level Usage

Target decorator:

```ts
@RequireAccess({
  systemCode: 2,
  resourceCode: 1001,
  actionCode: 1,
})
```

Later, after the contracts package:

```ts
@RequireAccess({
  systemCode: SystemCode.SALES,
  resourceCode: ResourceCode.SALES_PROFORMA,
  actionCode: ActionCode.READ,
})
```

The decorator only stores metadata. `AccessGuard` and a future
`PermissionService` perform the real database check before the controller runs.

## Permission Evaluation Order

Recommended order:

1. Validate access token and auth session.
2. Load user.
3. Deny if user is inactive, unverified when verification is required, or soft-deleted.
4. Load requested company/branch context from headers or route context.
5. Deny if company or branch is inactive.
6. Load active `UserRole` records for user + company.
7. Load active roles and role permissions.
8. Apply explicit `DENY` overrides first.
9. Check role permission or explicit `ALLOW` override.
10. Check `UserRoleScope` or override scope.
11. Check branch list when scope is `BRANCH` or branch-bound `OWN`.
12. Check owner when scope is `OWN`.
13. Check JSON conditions for `CUSTOM` or amount/status limits.
14. Allow or deny.

Explicit deny always beats allow.

## Frontend Ability Shape

Frontend receives compact effective abilities only for UI decisions:

```json
{
  "abilities": {
    "2.1001.1": {
      "branch": ["branch_tehran", "branch_shiraz"]
    },
    "2.1001.3": {
      "own": ["branch_tehran"]
    }
  }
}
```

Frontend hidden buttons are not security. Backend guards and service policy
checks are the source of truth.

## Phase 1 Seed

Phase 1 seeds only auth/authorization metadata:

```text
company: Demo Company
branches:
  Tehran Branch
  Shiraz Branch

systems:
  FINANCE = 1
  SALES = 2
  INVENTORY = 3
  IAM = 90

resources:
  1000 SALES_INVOICE
  1001 SALES_PROFORMA
  1003 SALES_CENTER

actions:
  READ, CREATE, UPDATE, SOFT_DELETE, HARD_DELETE, APPROVE, REJECT,
  CANCEL, PRINT, EXPORT, SUBMIT

roles:
  TEST_ADMIN
  SALES_OPERATOR
  BRANCH_MANAGER
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
