import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import {Observable, map} from 'rxjs';
import {MessageService} from '@app/common/services/messageService/message.service';
import {Reflector} from "@nestjs/core";
import {RESPONSE_MESSAGE_KEY} from "../../../../src/decorators/response-message.decorator";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly messageService: MessageService,
    ) {
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const messageKey = this.reflector.get<string>(
            RESPONSE_MESSAGE_KEY,
            context.getHandler(),
        );

        const req = context.switchToHttp().getRequest();
        const lang = req.lang || 'en';

        return next.handle().pipe(
            map((data) => {
                const message = messageKey
                    ? this.messageService.get(messageKey, lang)
                    : data?.message || "Successful request";

                const finalData = data?.data || data || null
                if (message === finalData?.message)
                    delete finalData.message
                return {
                    data: finalData,
                    message,
                    error: false,
                };
            }),
        );
    }
}
