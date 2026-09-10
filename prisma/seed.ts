import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, ScopeType } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TEST_PASSWORD = 'Passw0rd!123';
const TEST_PASSWORD_HASH =
  '$2b$10$75Ym9s5HW4xbbQeSfE/PYuU9hhHDso1ClAPtYw4NujuukvvIkvDTG';

const SYSTEM = {
  FINANCE: { code: 1, key: 'FINANCE', name: 'Finance' },
  SALES: { code: 2, key: 'SALES', name: 'Sales' },
  INVENTORY: { code: 3, key: 'INVENTORY', name: 'Inventory' },
  IAM: { code: 90, key: 'IAM', name: 'Identity and Access Management' },
};

const RESOURCE = {
  SALES_INVOICE: {
    systemCode: SYSTEM.SALES.code,
    code: 1000,
    key: 'SALES_INVOICE',
    name: 'Sales Invoice',
  },
  SALES_PROFORMA: {
    systemCode: SYSTEM.SALES.code,
    code: 1001,
    key: 'SALES_PROFORMA',
    name: 'Sales Proforma',
  },
  SALES_CENTER: {
    systemCode: SYSTEM.SALES.code,
    code: 1003,
    key: 'SALES_CENTER',
    name: 'Sales Center',
  },
};

const ACTION = {
  READ: { code: 1, key: 'READ', name: 'Read' },
  CREATE: { code: 2, key: 'CREATE', name: 'Create' },
  UPDATE: { code: 3, key: 'UPDATE', name: 'Update' },
  SOFT_DELETE: { code: 4, key: 'SOFT_DELETE', name: 'Soft delete' },
  HARD_DELETE: { code: 5, key: 'HARD_DELETE', name: 'Hard delete' },
  APPROVE: { code: 6, key: 'APPROVE', name: 'Approve' },
  REJECT: { code: 7, key: 'REJECT', name: 'Reject' },
  CANCEL: { code: 8, key: 'CANCEL', name: 'Cancel' },
  PRINT: { code: 9, key: 'PRINT', name: 'Print' },
  EXPORT: { code: 10, key: 'EXPORT', name: 'Export' },
  SUBMIT: { code: 11, key: 'SUBMIT', name: 'Submit' },
};

async function main() {
  const passwordHash =
    process.env.SEED_USER_PASSWORD_HASH ||
    (process.env.SEED_USER_PASSWORD
      ? await bcrypt.hash(process.env.SEED_USER_PASSWORD, 10)
      : TEST_PASSWORD_HASH);

  const company = await prisma.company.upsert({
    where: { nationalId: 'DEMO-ERP-001' },
    update: {
      name: 'Demo Company',
      legalName: 'Demo Company',
      isActive: true,
    },
    create: {
      name: 'Demo Company',
      legalName: 'Demo Company',
      nationalId: 'DEMO-ERP-001',
    },
  });

  const tehranBranch = await upsertBranch({
    companyId: company.id,
    code: 'tehran',
    name: 'Tehran Branch',
    city: 'Tehran',
  });

  const shirazBranch = await upsertBranch({
    companyId: company.id,
    code: 'shiraz',
    name: 'Shiraz Branch',
    city: 'Shiraz',
  });

  for (const system of Object.values(SYSTEM)) {
    await prisma.system.upsert({
      where: { code: system.code },
      update: {
        key: system.key,
        name: system.name,
        isActive: true,
      },
      create: system,
    });
  }

  for (const resource of Object.values(RESOURCE)) {
    await prisma.resource.upsert({
      where: {
        systemCode_code: {
          systemCode: resource.systemCode,
          code: resource.code,
        },
      },
      update: {
        key: resource.key,
        name: resource.name,
        isActive: true,
      },
      create: resource,
    });
  }

  for (const action of Object.values(ACTION)) {
    await prisma.action.upsert({
      where: { code: action.code },
      update: {
        key: action.key,
        name: action.name,
        isActive: true,
      },
      create: action,
    });
  }

  const permissions = await Promise.all([
    upsertPermission(RESOURCE.SALES_PROFORMA, ACTION.READ),
    upsertPermission(RESOURCE.SALES_PROFORMA, ACTION.CREATE),
    upsertPermission(RESOURCE.SALES_PROFORMA, ACTION.UPDATE),
    upsertPermission(RESOURCE.SALES_PROFORMA, ACTION.APPROVE),
    upsertPermission(RESOURCE.SALES_INVOICE, ACTION.READ),
    upsertPermission(RESOURCE.SALES_INVOICE, ACTION.CREATE),
    upsertPermission(RESOURCE.SALES_INVOICE, ACTION.SOFT_DELETE),
    upsertPermission(RESOURCE.SALES_CENTER, ACTION.READ),
  ]);

  const permissionByKey = new Map(
    permissions.map((permission) => [permission.key, permission]),
  );

  const roles = await Promise.all([
    upsertRole(company.id, 'TEST_ADMIN', 'Test Admin'),
    upsertRole(company.id, 'SALES_OPERATOR', 'Sales Operator'),
    upsertRole(company.id, 'BRANCH_MANAGER', 'Branch Manager'),
  ]);

  const roleByKey = new Map(roles.map((role) => [role.key, role]));

  for (const permission of permissions) {
    await grantRolePermission({
      roleId: getRequired(roleByKey, 'TEST_ADMIN').id,
      permissionId: permission.id,
    });
  }

  await grantRolePermission({
    roleId: getRequired(roleByKey, 'SALES_OPERATOR').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1001, 1)).id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByKey, 'SALES_OPERATOR').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1001, 2)).id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByKey, 'SALES_OPERATOR').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1001, 3)).id,
  });

  await grantRolePermission({
    roleId: getRequired(roleByKey, 'BRANCH_MANAGER').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1001, 1)).id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByKey, 'BRANCH_MANAGER').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1001, 6)).id,
  });
  await grantRolePermission({
    roleId: getRequired(roleByKey, 'BRANCH_MANAGER').id,
    permissionId: getRequired(permissionByKey, permissionKey(2, 1000, 1)).id,
  });

  const admin = await seedUser({
    roleId: getRequired(roleByKey, 'TEST_ADMIN').id,
    companyId: company.id,
    phone: '09120000001',
    username: 'test_admin',
    email: 'test_admin@example.com',
    firstName: 'Test',
    lastName: 'Admin',
    passwordHash,
  });

  const operator = await seedUser({
    roleId: getRequired(roleByKey, 'SALES_OPERATOR').id,
    companyId: company.id,
    phone: '09120000002',
    username: 'test_sales_operator',
    email: 'test_sales_operator@example.com',
    firstName: 'Test',
    lastName: 'Operator',
    passwordHash,
  });

  const manager = await seedUser({
    roleId: getRequired(roleByKey, 'BRANCH_MANAGER').id,
    companyId: company.id,
    phone: '09120000003',
    username: 'test_branch_manager',
    email: 'test_branch_manager@example.com',
    firstName: 'Test',
    lastName: 'Manager',
    passwordHash,
  });

  await replaceUserRoleScopes(admin.userRoleId, [
    {
      scopeType: ScopeType.COMPANY,
    },
  ]);

  await replaceUserRoleScopes(operator.userRoleId, [
    {
      scopeType: ScopeType.OWN,
      systemCode: RESOURCE.SALES_PROFORMA.systemCode,
      resourceCode: RESOURCE.SALES_PROFORMA.code,
      actionCode: ACTION.UPDATE.code,
      branchIds: [tehranBranch.id],
    },
    {
      scopeType: ScopeType.BRANCH,
      systemCode: RESOURCE.SALES_PROFORMA.systemCode,
      resourceCode: RESOURCE.SALES_PROFORMA.code,
      actionCode: ACTION.READ.code,
      branchIds: [shirazBranch.id],
    },
    {
      scopeType: ScopeType.BRANCH,
      systemCode: RESOURCE.SALES_PROFORMA.systemCode,
      resourceCode: RESOURCE.SALES_PROFORMA.code,
      actionCode: ACTION.CREATE.code,
      branchIds: [tehranBranch.id, shirazBranch.id],
    },
  ]);

  await replaceUserRoleScopes(manager.userRoleId, [
    {
      scopeType: ScopeType.BRANCH,
      branchIds: [tehranBranch.id, shirazBranch.id],
    },
  ]);

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      actorUserId: admin.user.id,
      action: 'IAM_SEEDED',
      entityType: 'IamFoundation',
      entityId: company.id,
      metadata: {
        users: [admin.user.phone, operator.user.phone, manager.user.phone],
        password: process.env.SEED_USER_PASSWORD ? 'custom' : TEST_PASSWORD,
        permissions: permissions.map((permission) => permission.key),
      },
    },
  });

  console.log('Seeded auth and permission foundation.');
  console.log(
    `Demo password: ${process.env.SEED_USER_PASSWORD || TEST_PASSWORD}`,
  );
}

async function upsertBranch(input: {
  companyId: string;
  code: string;
  name: string;
  city: string;
}) {
  return prisma.branch.upsert({
    where: {
      companyId_code: {
        companyId: input.companyId,
        code: input.code,
      },
    },
    update: {
      name: input.name,
      city: input.city,
      isActive: true,
    },
    create: input,
  });
}

async function upsertPermission(
  resource: {
    systemCode: number;
    code: number;
    key: string;
    name: string;
  },
  action: {
    code: number;
    key: string;
    name: string;
  },
) {
  const key = permissionKey(resource.systemCode, resource.code, action.code);
  const readableKey = `${resource.key}.${action.key}`;

  return prisma.permission.upsert({
    where: {
      systemCode_resourceCode_actionCode: {
        systemCode: resource.systemCode,
        resourceCode: resource.code,
        actionCode: action.code,
      },
    },
    update: {
      key,
      readableKey,
      isActive: true,
      deprecatedAt: null,
      description: `${action.name} ${resource.name}`,
    },
    create: {
      systemCode: resource.systemCode,
      resourceCode: resource.code,
      actionCode: action.code,
      key,
      readableKey,
      description: `${action.name} ${resource.name}`,
    },
  });
}

async function upsertRole(companyId: string, key: string, name: string) {
  return prisma.role.upsert({
    where: {
      companyId_key: {
        companyId,
        key,
      },
    },
    update: {
      name,
      isSystem: true,
      isActive: true,
    },
    create: {
      companyId,
      key,
      name,
      isSystem: true,
    },
  });
}

async function grantRolePermission(input: {
  roleId: string;
  permissionId: string;
}) {
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: input,
    },
    update: {},
    create: input,
  });
}

async function seedUser(input: {
  roleId: string;
  companyId: string;
  phone: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}) {
  const user = await prisma.user.upsert({
    where: {
      phone: input.phone,
    },
    update: {
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName} ${input.lastName}`,
      passwordHash: input.passwordHash,
      isVerified: true,
      isActive: true,
    },
    create: {
      phone: input.phone,
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName} ${input.lastName}`,
      passwordHash: input.passwordHash,
      isVerified: true,
      isActive: true,
    },
  });

  const userRole = await prisma.userRole.upsert({
    where: {
      userId_roleId_companyId: {
        userId: user.id,
        roleId: input.roleId,
        companyId: input.companyId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: input.roleId,
      companyId: input.companyId,
    },
  });

  return { user, userRoleId: userRole.id };
}

async function replaceUserRoleScopes(
  userRoleId: string,
  scopes: {
    scopeType: ScopeType;
    systemCode?: number;
    resourceCode?: number;
    actionCode?: number;
    conditions?: Prisma.InputJsonValue;
    branchIds?: string[];
  }[],
) {
  await prisma.userRoleScope.deleteMany({
    where: { userRoleId },
  });

  for (const scope of scopes) {
    await prisma.userRoleScope.create({
      data: {
        userRoleId,
        scopeType: scope.scopeType,
        systemCode: scope.systemCode,
        resourceCode: scope.resourceCode,
        actionCode: scope.actionCode,
        conditions: scope.conditions,
        branches: scope.branchIds?.length
          ? {
              create: scope.branchIds.map((branchId) => ({
                branchId,
              })),
            }
          : undefined,
      },
    });
  }
}

function permissionKey(
  systemCode: number,
  resourceCode: number,
  actionCode: number,
) {
  return `${systemCode}.${resourceCode}.${actionCode}`;
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
