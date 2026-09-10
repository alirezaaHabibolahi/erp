import { PermissionEffect, ScopeType } from '@prisma/client';
import { vi } from 'vitest';
import { PrismaService } from '@app/common/database/postgres';
import { AccessService } from './access.service';
import { ActionCode, ResourceCode, SystemCode } from './access-codes';

describe('AccessService', () => {
  const findBranch = vi.fn();
  const findPermission = vi.fn();
  const findOverrides = vi.fn();
  const findUserRoles = vi.fn();
  const prisma = {
    branch: { findFirst: findBranch },
    permission: { findFirst: findPermission },
    userPermissionOverride: { findMany: findOverrides },
    userRole: { findMany: findUserRoles },
  } as unknown as PrismaService;
  const service = new AccessService(prisma);
  const readProforma = {
    systemCode: SystemCode.SALES,
    resourceCode: ResourceCode.SALES_PROFORMA,
    actionCode: ActionCode.READ,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows a matching branch scoped role permission', async () => {
    findBranch.mockResolvedValue({
      id: 'branch-shiraz',
      companyId: 'company-1',
    });
    findPermission.mockResolvedValue({ id: 'permission-read-proforma' });
    findOverrides.mockResolvedValue([]);
    findUserRoles.mockResolvedValue([
      {
        scopes: [
          {
            scopeType: ScopeType.BRANCH,
            systemCode: SystemCode.SALES,
            resourceCode: ResourceCode.SALES_PROFORMA,
            actionCode: ActionCode.READ,
            conditions: null,
            branches: [{ branchId: 'branch-shiraz' }],
          },
        ],
      },
    ]);

    await expect(
      service.canAccess('user-1', readProforma, {
        branchId: 'branch-shiraz',
      }),
    ).resolves.toBe(true);
    expect(findUserRoles).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
      }),
    );
  });

  it('rejects a branch scoped role when the branch does not match', async () => {
    findBranch.mockResolvedValue({
      id: 'branch-tehran',
      companyId: 'company-1',
    });
    findPermission.mockResolvedValue({ id: 'permission-read-proforma' });
    findOverrides.mockResolvedValue([]);
    findUserRoles.mockResolvedValue([
      {
        scopes: [
          {
            scopeType: ScopeType.BRANCH,
            systemCode: SystemCode.SALES,
            resourceCode: ResourceCode.SALES_PROFORMA,
            actionCode: ActionCode.READ,
            conditions: null,
            branches: [{ branchId: 'branch-shiraz' }],
          },
        ],
      },
    ]);

    await expect(
      service.canAccess('user-1', readProforma, {
        branchId: 'branch-tehran',
      }),
    ).resolves.toBe(false);
  });

  it('requires the current user to own OWN scoped access', async () => {
    findBranch.mockResolvedValue({
      id: 'branch-tehran',
      companyId: 'company-1',
    });
    findPermission.mockResolvedValue({ id: 'permission-update-proforma' });
    findOverrides.mockResolvedValue([]);
    findUserRoles.mockResolvedValue([
      {
        scopes: [
          {
            scopeType: ScopeType.OWN,
            systemCode: SystemCode.SALES,
            resourceCode: ResourceCode.SALES_PROFORMA,
            actionCode: ActionCode.UPDATE,
            conditions: null,
            branches: [{ branchId: 'branch-tehran' }],
          },
        ],
      },
    ]);

    const updateProforma = {
      ...readProforma,
      actionCode: ActionCode.UPDATE,
    };

    await expect(
      service.canAccess('user-1', updateProforma, {
        branchId: 'branch-tehran',
        ownerUserId: 'user-1',
      }),
    ).resolves.toBe(true);
    await expect(
      service.canAccess('user-1', updateProforma, {
        branchId: 'branch-tehran',
        ownerUserId: 'other-user',
      }),
    ).resolves.toBe(false);
  });

  it('lets deny overrides win over role access', async () => {
    findBranch.mockResolvedValue(null);
    findPermission.mockResolvedValue({ id: 'permission-read-proforma' });
    findOverrides.mockResolvedValue([
      {
        effect: PermissionEffect.DENY,
        scopeType: ScopeType.COMPANY,
        conditions: null,
        branches: [],
      },
    ]);

    await expect(
      service.canAccess('user-1', readProforma, {
        companyId: 'company-1',
      }),
    ).resolves.toBe(false);
    expect(findUserRoles).not.toHaveBeenCalled();
  });

  it('builds a code based access list for the current user', async () => {
    findUserRoles.mockResolvedValueOnce([
      {
        companyId: 'company-1',
        scopes: [
          {
            scopeType: ScopeType.BRANCH,
            systemCode: null,
            resourceCode: null,
            actionCode: null,
            conditions: null,
            branches: [{ branchId: 'branch-tehran' }],
          },
        ],
        role: {
          rolePermissions: [
            {
              permission: {
                systemCode: SystemCode.SALES,
                resourceCode: ResourceCode.SALES_INVOICE,
                actionCode: ActionCode.READ,
                key: '2.1000.1',
                readableKey: 'SALES_INVOICE.READ',
              },
            },
          ],
        },
      },
    ]);
    findOverrides.mockResolvedValueOnce([]);

    await expect(service.getUserAccess('user-1')).resolves.toEqual({
      access: [
        {
          systemCode: SystemCode.SALES,
          resourceCode: ResourceCode.SALES_INVOICE,
          actionCode: ActionCode.READ,
          key: '2.1000.1',
          readableKey: 'SALES_INVOICE.READ',
          scopes: [
            {
              scopeType: ScopeType.BRANCH,
              companyId: 'company-1',
              branchIds: ['branch-tehran'],
              conditions: null,
            },
          ],
        },
      ],
      deniedAccess: [],
    });
  });
});
