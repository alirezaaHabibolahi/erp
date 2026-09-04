import { Reflector } from '@nestjs/core';

export interface RequiredAccess {
  systemCode: number;
  resourceCode: number;
  actionCode: number;
}

export const RequireAccess = Reflector.createDecorator<
  RequiredAccess | RequiredAccess[],
  RequiredAccess[]
>({
  key: 'required_access',
  transform: (access) => (Array.isArray(access) ? access : [access]),
});
