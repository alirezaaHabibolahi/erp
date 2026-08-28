import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '@app/common/dto';

const getCurrentUserByContext = (
  context: ExecutionContext,
): TokenPayload | undefined => context.switchToHttp().getRequest().user;

export const CurrentUser = createParamDecorator(
  (data: keyof TokenPayload | undefined, context: ExecutionContext) => {
    const user = getCurrentUserByContext(context);
    return data ? user?.[data] : user;
  },
);
