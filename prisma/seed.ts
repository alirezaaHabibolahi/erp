import * as bcrypt from 'bcrypt';
import { PermissionEffect, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Passw0rd!123';
const TEST_PASSWORD_HASH =
  '$2b$10$75Ym9s5HW4xbbQeSfE/PYuU9hhHDso1ClAPtYw4NujuukvvIkvDTG';

async function main() {
  const passwordHash =
    process.env.SEED_USER_PASSWORD_HASH ||
    (process.env.SEED_USER_PASSWORD
      ? await bcrypt.hash(process.env.SEED_USER_PASSWORD, 10)
      : TEST_PASSWORD_HASH);

  const company = await prisma.company.upsert({
    where: { nationalId: 'DEMO-ERP-001' },
    update: {},
    create: {
      name: 'Demo Company',
      legalName: 'Demo Company',
      nationalId: 'DEMO-ERP-001',
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      companyId_code: {
        companyId: company.id,
        code: 'tehran',
      },
    },
    update: {},
    create: {
      companyId: company.id,
      code: 'tehran',
      name: 'Tehran Branch',
      city: 'Tehran',
    },
  });

  const subsystem = await prisma.subsystem.upsert({
    where: { code: 'test_sales' },
    update: {},
    create: {
      code: 'test_sales',
      name: 'Test Sales',
      description: 'Temporary subsystem for auth and permission tests.',
    },
  });

  const resource = await prisma.resource.upsert({
    where: {
      subsystemId_code: {
        subsystemId: subsystem.id,
        code: 'test_invoice',
      },
    },
    update: {},
    create: {
      subsystemId: subsystem.id,
      code: 'test_invoice',
      name: 'Test Invoice',
      tableName: null,
      description: 'Temporary resource for authorization checks.',
    },
  });

  const actions = await Promise.all(
    [
      ['read', 'Read'],
      ['create', 'Create'],
      ['approve', 'Approve'],
    ].map(([code, name]) =>
      prisma.action.upsert({
        where: { code },
        update: {},
        create: { code, name },
      }),
    ),
  );

  const scopes = await Promise.all(
    [
      ['own', 'Own records'],
      ['branch', 'Branch records'],
      ['company', 'Company records'],
      ['all', 'All records'],
    ].map(([code, name]) =>
      prisma.scope.upsert({
        where: { code },
        update: {},
        create: { code, name },
      }),
    ),
  );

  const actionByCode = new Map(actions.map((action) => [action.code, action]));
  const scopeByCode = new Map(scopes.map((scope) => [scope.code, scope]));

  const permissions = await Promise.all(
    ['read', 'create', 'approve'].map((actionCode) => {
      const action = actionByCode.get(actionCode);
      if (!action) {
        throw new Error(`Missing seeded action: ${actionCode}`);
      }

      return prisma.permission.upsert({
        where: { code: `test_sales.test_invoice.${actionCode}` },
        update: {},
        create: {
          subsystemId: subsystem.id,
          resourceId: resource.id,
          actionId: action.id,
          code: `test_sales.test_invoice.${actionCode}`,
          name: `Test invoice ${actionCode}`,
        },
      });
    }),
  );

  const permissionByCode = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );

  const roles = await Promise.all(
    [
      ['test_admin', 'Test Admin'],
      ['test_sales_operator', 'Test Sales Operator'],
      ['test_branch_manager', 'Test Branch Manager'],
    ].map(([code, name]) =>
      prisma.role.upsert({
        where: {
          companyId_code: {
            companyId: company.id,
            code,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          code,
          name,
          isSystem: true,
        },
      }),
    ),
  );

  const roleByCode = new Map(roles.map((role) => [role.code, role]));

  await grantRolePermission({
    roleId: getRequired(roleByCode, 'test_sales_operator').id,
    permissionId: getRequired(permissionByCode, 'test_sales.test_invoice.read')
      .id,
    scopeId: getRequired(scopeByCode, 'own').id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByCode, 'test_sales_operator').id,
    permissionId: getRequired(
      permissionByCode,
      'test_sales.test_invoice.create',
    ).id,
    scopeId: getRequired(scopeByCode, 'branch').id,
  });

  await grantRolePermission({
    roleId: getRequired(roleByCode, 'test_branch_manager').id,
    permissionId: getRequired(permissionByCode, 'test_sales.test_invoice.read')
      .id,
    scopeId: getRequired(scopeByCode, 'branch').id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByCode, 'test_branch_manager').id,
    permissionId: getRequired(
      permissionByCode,
      'test_sales.test_invoice.approve',
    ).id,
    scopeId: getRequired(scopeByCode, 'branch').id,
  });

  for (const permission of permissions) {
    await grantRolePermission({
      roleId: getRequired(roleByCode, 'test_admin').id,
      permissionId: permission.id,
      scopeId: getRequired(scopeByCode, 'all').id,
    });
  }

  const users = await Promise.all([
    seedUser({
      companyId: company.id,
      branchId: branch.id,
      roleId: getRequired(roleByCode, 'test_admin').id,
      phone: '09120000001',
      username: 'test_admin',
      email: 'test_admin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      passwordHash,
      isSuperAdmin: true,
    }),
    seedUser({
      companyId: company.id,
      branchId: branch.id,
      roleId: getRequired(roleByCode, 'test_sales_operator').id,
      phone: '09120000002',
      username: 'test_sales_operator',
      email: 'test_sales_operator@example.com',
      firstName: 'Test',
      lastName: 'Operator',
      passwordHash,
    }),
    seedUser({
      companyId: company.id,
      branchId: branch.id,
      roleId: getRequired(roleByCode, 'test_branch_manager').id,
      phone: '09120000003',
      username: 'test_branch_manager',
      email: 'test_branch_manager@example.com',
      firstName: 'Test',
      lastName: 'Manager',
      passwordHash,
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      actorUserId: users[0].id,
      action: 'iam.seeded',
      entityType: 'iam_test_foundation',
      entityId: company.id,
      metadata: {
        users: users.map((user) => user.phone),
        password: process.env.SEED_USER_PASSWORD ? 'custom' : TEST_PASSWORD,
      },
    },
  });

  console.log('Seeded auth and permission test foundation.');
  console.log(
    `Demo password: ${process.env.SEED_USER_PASSWORD || TEST_PASSWORD}`,
  );
}

async function grantRolePermission(input: {
  roleId: string;
  permissionId: string;
  scopeId: string;
}) {
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId_scopeId: input,
    },
    update: {
      effect: PermissionEffect.ALLOW,
    },
    create: {
      ...input,
      effect: PermissionEffect.ALLOW,
    },
  });
}

async function seedUser(input: {
  companyId: string;
  branchId: string;
  roleId: string;
  phone: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  isSuperAdmin?: boolean;
}) {
  const user = await prisma.user.upsert({
    where: {
      companyId_phone: {
        companyId: input.companyId,
        phone: input.phone,
      },
    },
    update: {
      branchId: input.branchId,
      passwordHash: input.passwordHash,
      isVerified: true,
      isActive: true,
      isSuperAdmin: input.isSuperAdmin ?? false,
    },
    create: {
      companyId: input.companyId,
      branchId: input.branchId,
      phone: input.phone,
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
      isVerified: true,
      isActive: true,
      isSuperAdmin: input.isSuperAdmin ?? false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_branchId: {
        userId: user.id,
        roleId: input.roleId,
        branchId: input.branchId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: input.roleId,
      branchId: input.branchId,
    },
  });

  return user;
}

function getRequired<T>(map: Map<string, T>, key: string): T {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing seed value: ${key}`);
  }
  return value;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
