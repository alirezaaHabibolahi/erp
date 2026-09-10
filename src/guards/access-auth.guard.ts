import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ErrorCode, MessageKey } from '@app/common/constants';
import type { TokenPayload } from '@app/common/dto';
import { AccessHelper } from '@app/common/utils';
import { AccessService } from '../access/access.service';
import { RequireAccess } from '../decorators/access.decorator';

type RequestWithUser = Request & {
  user?: TokenPayload;
};

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAccess = this.reflector.getAllAndOverride(RequireAccess, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAccess?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request?.user;

    if (!user) {
      throw new UnauthorizedException(
        { message: MessageKey.AUTH_UNAUTHORIZED },
        { errorCode: ErrorCode.AUTHENTICATION_REQUIRED },
      );
    }

    const accessContext = AccessHelper.extractRequestContext(request);
    const checks = await Promise.all(
      requiredAccess.map((access) =>
        this.accessService.canAccess(user.sub, access, accessContext),
      ),
    );

    if (checks.every(Boolean)) {
      return true;
    }

    throw new ForbiddenException(
      { message: MessageKey.GENERAL_FORBIDDEN },
      { errorCode: ErrorCode.ACCESS_DENIED },
    );
  }
}
