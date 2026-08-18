import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '@app/common/dto';

const getCurrentUserByContext = (context: ExecutionContext): TokenPayload => {
    return context.switchToHttp().getRequest().user;
};

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) =>
        getCurrentUserByContext(context),
);
