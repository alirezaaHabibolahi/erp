import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Access } from '../decorators/access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const access = this.reflector.get(Access, context.getHandler());
      if (!access) return true;
      const request = context.switchToHttp().getRequest();
      const user = request?.user;
      if (user) {
        if (user.is_admin || !access?.access_list?.length) return true;
        let access_names: string[] = user?.accesses;
        const neededAccess = access.access_list;
        for (let key of neededAccess) {
          if (!access_names.includes(key)) {
            throw new ForbiddenException(
              'شما دسترسی لازم برای انجام این کار را ندارید !',
            );
          }
        }
        return true;
      }
      throw new ForbiddenException(
        'شما دسترسی لازم برای انجام این کار را ندارید !',
      );
    } catch (e) {
      throw new UnauthorizedException(
        'شما دسترسی لازم برای انجام این کار را ندارید !',
      );
    }
  }
}
