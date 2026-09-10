import type { Request } from 'express';
import { ScopeType } from '@prisma/client';

export type AccessCode = {
  systemCode: number;
  resourceCode: number;
  actionCode: number;
};

export type AccessContextInput = {
  companyId?: string;
  branchId?: string;
  ownerUserId?: string;
};

export type AccessBranchContext = {
  id: string;
  companyId: string;
};

export type AccessContext = AccessContextInput & {
  branchCompanyId?: string;
  isValid: boolean;
};

export type AccessScopeCandidate = {
  scopeType: ScopeType;
  systemCode?: number | null;
  resourceCode?: number | null;
  actionCode?: number | null;
  conditions?: unknown;
  branches?: { branchId: string }[];
};

export type AccessAbilityScope = {
  scopeType: ScopeType;
  companyId: string;
  branchIds: string[];
  conditions?: unknown;
};

export type AccessAbility = AccessCode & {
  key: string;
  readableKey: string;
  scopes: AccessAbilityScope[];
};

type RequestWithAccessContext = Request & {
  body?: unknown;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

export class AccessHelper {
  static extractRequestContext(
    request: RequestWithAccessContext,
  ): AccessContextInput {
    return {
      companyId:
        this.firstString(request.headers['x-company-id']) ??
        this.fieldString(request.params, 'companyId') ??
        this.fieldString(request.body, 'companyId') ??
        this.fieldString(request.query, 'companyId'),
      branchId:
        this.firstString(request.headers['x-branch-id']) ??
        this.fieldString(request.params, 'branchId') ??
        this.fieldString(request.body, 'branchId') ??
        this.fieldString(request.query, 'branchId'),
      ownerUserId:
        this.firstString(request.headers['x-owner-user-id']) ??
        this.fieldString(request.params, 'ownerUserId') ??
        this.fieldString(request.body, 'ownerUserId') ??
        this.fieldString(request.body, 'createdById') ??
        this.fieldString(request.query, 'ownerUserId') ??
        this.fieldString(request.query, 'createdById'),
    };
  }

  static resolveContext(
    input: AccessContextInput,
    branch?: AccessBranchContext | null,
  ): AccessContext {
    if (input.branchId && !branch) {
      return { ...input, isValid: false };
    }

    if (
      input.companyId &&
      branch?.companyId &&
      input.companyId !== branch.companyId
    ) {
      return {
        ...input,
        branchCompanyId: branch.companyId,
        isValid: false,
      };
    }

    return {
      ...input,
      companyId: input.companyId ?? branch?.companyId,
      branchCompanyId: branch?.companyId,
      isValid: true,
    };
  }

  static scopeMatchesAccess(
    scope: AccessScopeCandidate,
    access: AccessCode,
    context: AccessContext,
    userId: string,
  ): boolean {
    if (!context.isValid || !this.scopeAppliesToAccess(scope, access)) {
      return false;
    }

    switch (scope.scopeType) {
      case ScopeType.ALL:
      case ScopeType.COMPANY:
        return true;
      case ScopeType.BRANCH:
        return Boolean(
          context.branchId && this.scopeHasBranch(scope, context.branchId),
        );
      case ScopeType.OWN:
        return (
          context.ownerUserId === userId &&
          (!context.branchId ||
            !scope.branches?.length ||
            this.scopeHasBranch(scope, context.branchId))
        );
      case ScopeType.CUSTOM:
        return false;
      default:
        return false;
    }
  }

  static scopeAppliesToAccess(
    scope: AccessScopeCandidate,
    access: AccessCode,
  ): boolean {
    return (
      this.matchesOptionalCode(scope.systemCode, access.systemCode) &&
      this.matchesOptionalCode(scope.resourceCode, access.resourceCode) &&
      this.matchesOptionalCode(scope.actionCode, access.actionCode)
    );
  }

  static upsertAbilityScope(
    abilities: Map<string, AccessAbility>,
    access: AccessCode & { key: string; readableKey: string },
    scope: AccessAbilityScope,
  ): void {
    const abilityKey = this.permissionKey(access);
    const ability = abilities.get(abilityKey) ?? {
      systemCode: access.systemCode,
      resourceCode: access.resourceCode,
      actionCode: access.actionCode,
      key: access.key,
      readableKey: access.readableKey,
      scopes: [],
    };
    const scopeKey = this.abilityScopeKey(scope);

    if (
      !ability.scopes.some((item) => this.abilityScopeKey(item) === scopeKey)
    ) {
      ability.scopes.push(scope);
    }

    abilities.set(abilityKey, ability);
  }

  static permissionKey(access: AccessCode): string {
    return `${access.systemCode}.${access.resourceCode}.${access.actionCode}`;
  }

  private static matchesOptionalCode(
    expected: number | null | undefined,
    actual: number,
  ): boolean {
    return expected === null || expected === undefined || expected === actual;
  }

  private static scopeHasBranch(
    scope: AccessScopeCandidate,
    branchId: string,
  ): boolean {
    return (
      scope.branches?.some((branch) => branch.branchId === branchId) ?? false
    );
  }

  private static abilityScopeKey(scope: AccessAbilityScope): string {
    return [
      scope.scopeType,
      scope.companyId,
      scope.branchIds.slice().sort().join(','),
      JSON.stringify(scope.conditions ?? null),
    ].join(':');
  }

  private static firstString(
    value: string | string[] | undefined,
  ): string | undefined {
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim() || undefined;
  }

  private static fieldString(
    source: unknown,
    field: string,
  ): string | undefined {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return undefined;
    }

    const value = (source as Record<string, unknown>)[field];
    if (typeof value === 'string') {
      return value.trim() || undefined;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0].trim() || undefined;
    }

    return undefined;
  }
}
