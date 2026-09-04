import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorCode, MessageKey } from '@app/common/constants';

import { Public } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(error: unknown, user: TUser): TUser {
    if (error || !user) {
      throw new UnauthorizedException(
        { message: MessageKey.AUTH_UNAUTHORIZED },
        { errorCode: ErrorCode.AUTHENTICATION_REQUIRED },
      );
    }

    return user;
  }
}
