# Prisma Schema Modules

Prisma 7 loads this folder through `prisma.config.ts`.

Current files:

- `00-base.prisma`: generator and datasource provider.
- `organization.prisma`: company and branch models.
- `iam.prisma`: users, sessions, numeric permission catalog, role assignments,
  role scopes, and user overrides.
- `audit.prisma`: audit log models.

Planned future files:

- `settings.prisma`
- `sales.prisma`
- `inventory.prisma`
- `finance.prisma`
- `hr.prisma`

Add a new `.prisma` file only when the first real model for that ERP system is
implemented. Keep IAM/authorization infrastructure in `iam.prisma` unless a
future split becomes clearly useful.
