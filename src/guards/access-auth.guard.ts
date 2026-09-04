import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, MessageKey } from '@app/common/constants';
import { RequireAccess } from '../decorators/access.decorator';

type RequestWithUser = {
  user?: unknown;
};

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAccess = this.reflector.getAllAndOverride(RequireAccess, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAccess?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request?.user) {
      throw new UnauthorizedException(
        { message: MessageKey.AUTH_UNAUTHORIZED },
        { errorCode: ErrorCode.AUTHENTICATION_REQUIRED },
      );
    }

    throw new ForbiddenException(
      { message: MessageKey.GENERAL_FORBIDDEN },
      { errorCode: ErrorCode.ACCESS_POLICY_NOT_IMPLEMENTED },
    );
  }
}
