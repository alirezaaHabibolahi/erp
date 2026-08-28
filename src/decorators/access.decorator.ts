import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ACCESS_KEY = 'required_access';

export interface RequiredAccess {
  systemCode: number;
  resourceCode: number;
  actionCode: number;
}

export const RequireAccess = (access: RequiredAccess | RequiredAccess[]) =>
  SetMetadata(REQUIRED_ACCESS_KEY, Array.isArray(access) ? access : [access]);
