import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_ACCESS_KEY,
  RequiredAccess,
} from '../decorators/access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAccess = this.reflector.getAllAndOverride<RequiredAccess[]>(
      REQUIRED_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAccess?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!request?.user) {
      throw new UnauthorizedException('Authentication is required.');
    }

    throw new ForbiddenException(
      'Access evaluation service is not implemented yet.',
    );
  }
}
