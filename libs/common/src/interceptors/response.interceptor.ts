import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { MessageKey } from '@app/common/constants';
import { RequestContext } from '@app/common/context/request-context';
import { ResponseMessage } from '@app/common/decorators';
import { LanguageCode } from '@app/common/constants/messages/select-language';
import { MessageService } from '@app/common/services/messageService/message.service';

type RequestWithContext = Request & {
  lang?: LanguageCode;
  requestId?: string;
};

type ResponsePayload = {
  data?: unknown;
  message?: string;
  messageKey?: string;
  meta?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.hasOwn(value, key);

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly messageService: MessageService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const messageKey = this.reflector.getAllAndOverride(ResponseMessage, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const lang = request.lang || RequestContext.getLang();
    const requestId = request.requestId || RequestContext.getRequestId();

    return next.handle().pipe(
      map((payload) => {
        if (payload instanceof StreamableFile || this.isEnvelope(payload)) {
          return payload;
        }

        const payloadRecord = isRecord(payload)
          ? (payload as ResponsePayload & Record<string, unknown>)
          : undefined;
        const responseData =
          payloadRecord && hasOwn(payloadRecord, 'data')
            ? payloadRecord.data
            : (payload ?? null);
        const payloadMessage =
          payloadRecord && typeof payloadRecord.message === 'string'
            ? payloadRecord.message
            : undefined;
        const payloadMessageKey =
          payloadRecord && typeof payloadRecord.messageKey === 'string'
            ? payloadRecord.messageKey
            : undefined;
        const payloadMeta =
          payloadRecord && isRecord(payloadRecord.meta)
            ? payloadRecord.meta
            : {};
        const messageCandidate =
          messageKey ?? payloadMessageKey ?? payloadMessage;

        return {
          success: true,
          message: this.resolveMessage(messageCandidate, lang),
          data: responseData,
          meta: {
            requestId,
            path: request.originalUrl || request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
            language: lang,
            statusCode: response.statusCode,
            ...payloadMeta,
          },
        };
      }),
    );
  }

  private resolveMessage(
    message: string | undefined,
    lang: LanguageCode,
  ): string {
    if (!message) {
      return this.messageService.get(MessageKey.GENERAL_SUCCESS, lang);
    }

    return this.messageService.translate(message, lang);
  }

  private isEnvelope(payload: unknown): boolean {
    return (
      isRecord(payload) &&
      hasOwn(payload, 'success') &&
      hasOwn(payload, 'message') &&
      hasOwn(payload, 'meta')
    );
  }
}
