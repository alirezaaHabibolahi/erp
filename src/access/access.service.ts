import { Injectable } from '@nestjs/common';
import { PermissionEffect } from '@prisma/client';
import { PrismaService } from '@app/common/database/postgres';
import {
  AccessAbility,
  AccessContextInput,
  AccessHelper,
} from '@app/common/utils';
import { RequiredAccess } from '../decorators/access.decorator';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canAccess(
    userId: string,
    access: RequiredAccess,
    contextInput: AccessContextInput = {},
  ): Promise<boolean> {
    const now = new Date();
    const branch = contextInput.branchId
      ? await this.prisma.branch.findFirst({
          where: {
            id: contextInput.branchId,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            companyId: true,
          },
        })
      : null;
    const context = AccessHelper.resolveContext(contextInput, branch);

    if (!context.isValid) {
      return false;
    }

    const permission = await this.prisma.permission.findFirst({
      where: {
        systemCode: access.systemCode,
        resourceCode: access.resourceCode,
        actionCode: access.actionCode,
        isActive: true,
        deprecatedAt: null,
        resource: {
          isActive: true,
          system: {
            isActive: true,
          },
        },
        action: {
          isActive: true,
        },
      },
      select: {
        id: true,
      },
    });

    if (!permission) {
      return false;
    }

    const overrides = await this.prisma.userPermissionOverride.findMany({
      where: {
        userId,
        permissionId: permission.id,
        ...(context.companyId ? { companyId: context.companyId } : {}),
        company: {
          isActive: true,
          deletedAt: null,
        },
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        effect: true,
        scopeType: true,
        conditions: true,
        branches: {
          select: {
            branchId: true,
          },
        },
      },
    });
    const denyOverride = overrides.some(
      (override) =>
        override.effect === PermissionEffect.DENY &&
        AccessHelper.scopeMatchesAccess(override, access, context, userId),
    );

    if (denyOverride) {
      return false;
    }

    const allowOverride = overrides.some(
      (override) =>
        override.effect === PermissionEffect.ALLOW &&
        AccessHelper.scopeMatchesAccess(override, access, context, userId),
    );

    if (allowOverride) {
      return true;
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        ...(context.companyId ? { companyId: context.companyId } : {}),
        company: {
          isActive: true,
          deletedAt: null,
        },
        role: {
          isActive: true,
          deletedAt: null,
          rolePermissions: {
            some: {
              permissionId: permission.id,
            },
          },
        },
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        scopes: {
          select: {
            scopeType: true,
            systemCode: true,
            resourceCode: true,
            actionCode: true,
            conditions: true,
            branches: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    return userRoles.some((userRole) =>
      userRole.scopes.some((scope) =>
        AccessHelper.scopeMatchesAccess(scope, access, context, userId),
      ),
    );
  }

  async getUserAccess(userId: string): Promise<{
    access: AccessAbility[];
    deniedAccess: AccessAbility[];
  }> {
    const now = new Date();
    const abilities = new Map<string, AccessAbility>();
    const deniedAbilities = new Map<string, AccessAbility>();
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        company: {
          isActive: true,
          deletedAt: null,
        },
        role: {
          isActive: true,
          deletedAt: null,
        },
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        companyId: true,
        scopes: {
          select: {
            scopeType: true,
            systemCode: true,
            resourceCode: true,
            actionCode: true,
            conditions: true,
            branches: {
              select: {
                branchId: true,
              },
            },
          },
        },
        role: {
          select: {
            rolePermissions: {
              where: {
                permission: {
                  isActive: true,
                  deprecatedAt: null,
                  resource: {
                    isActive: true,
                    system: {
                      isActive: true,
                    },
                  },
                  action: {
                    isActive: true,
                  },
                },
              },
              select: {
                permission: {
                  select: {
                    systemCode: true,
                    resourceCode: true,
                    actionCode: true,
                    key: true,
                    readableKey: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permission = rolePermission.permission;

        for (const scope of userRole.scopes) {
          if (!AccessHelper.scopeAppliesToAccess(scope, permission)) {
            continue;
          }

          AccessHelper.upsertAbilityScope(abilities, permission, {
            scopeType: scope.scopeType,
            companyId: userRole.companyId,
            branchIds: scope.branches.map((branch) => branch.branchId),
            conditions: scope.conditions,
          });
        }
      }
    }

    const overrides = await this.prisma.userPermissionOverride.findMany({
      where: {
        userId,
        company: {
          isActive: true,
          deletedAt: null,
        },
        permission: {
          isActive: true,
          deprecatedAt: null,
          resource: {
            isActive: true,
            system: {
              isActive: true,
            },
          },
          action: {
            isActive: true,
          },
        },
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        companyId: true,
        effect: true,
        scopeType: true,
        conditions: true,
        branches: {
          select: {
            branchId: true,
          },
        },
        permission: {
          select: {
            systemCode: true,
            resourceCode: true,
            actionCode: true,
            key: true,
            readableKey: true,
          },
        },
      },
    });

    for (const override of overrides) {
      const target =
        override.effect === PermissionEffect.DENY ? deniedAbilities : abilities;

      AccessHelper.upsertAbilityScope(target, override.permission, {
        scopeType: override.scopeType,
        companyId: override.companyId,
        branchIds: override.branches.map((branch) => branch.branchId),
        conditions: override.conditions,
      });
    }

    return {
      access: Array.from(abilities.values()).sort(
        (left, right) =>
          left.systemCode - right.systemCode ||
          left.resourceCode - right.resourceCode ||
          left.actionCode - right.actionCode,
      ),
      deniedAccess: Array.from(deniedAbilities.values()).sort(
        (left, right) =>
          left.systemCode - right.systemCode ||
          left.resourceCode - right.resourceCode ||
          left.actionCode - right.actionCode,
      ),
    };
  }
}
