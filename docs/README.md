# ERP Backend Documentation

This folder is the single documentation home for the ERP backend. Every major
architecture decision, module design, database model, permission rule, and
implementation phase should be documented here.

The goal is simple: the codebase, the database, and the documentation should
move together. When a feature is added or a schema changes, update the matching
file in this folder.

## Folder Structure

```text
docs/
  architecture/
    01-current-backend.md
    02-target-backend-architecture.md
  database/
    02-target-postgresql-prisma-schema.md
  iam/
    01-iam-rbac-abac.md
  modules/
    00-module-template.md
    01-sales-invoice-flow.md
  standards/
    01-code-structure-and-conventions.md
  ai/
    01-ai-implementation-plan.md
```

## How To Use These Docs

For a new developer:

1. Read the root [README](../README.md).
2. Read [Current Backend Architecture](./architecture/01-current-backend.md).
3. Read [Target Backend Architecture](./architecture/02-target-backend-architecture.md).
4. Read [IAM, RBAC, ABAC](./iam/01-iam-rbac-abac.md).
5. Read the module doc for the area you are changing.

For AI-assisted implementation:

1. Read [AI Implementation Plan](./ai/01-ai-implementation-plan.md).
2. Read the target architecture and target database docs.
3. Implement one phase at a time.
4. Update documentation in the same pull request or task.

## Documentation Rules

- Use one file per topic.
- Keep filenames ordered with numeric prefixes.
- Keep implementation status explicit: current, target, planned, deprecated.
- Document database fields before creating migrations.
- Document permission codes before adding guards or admin UI controls.
- Do not introduce hardcoded roles or permissions without documenting why.
- Every ERP module should have its own file under `docs/modules`.

## Glossary

| Term      | Meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| IAM       | Identity and Access Management: users, auth, sessions, roles, access |
| RBAC      | Role-Based Access Control                                            |
| ABAC      | Attribute-Based Access Control                                       |
| System    | A major ERP area, such as sales, finance, inventory                  |
| Resource  | An entity inside a system, such as invoice or product                |
| Action    | An operation on a resource, such as READ, CREATE, APPROVE            |
| Scope     | The data boundary for a permission, such as OWN, BRANCH, COMPANY     |
| Condition | Extra dynamic access rule stored as JSONB in PostgreSQL              |
