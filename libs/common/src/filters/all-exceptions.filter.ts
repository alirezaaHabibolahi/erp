import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode, MessageKey } from '@app/common/constants';
import { RequestContext } from '@app/common/context/request-context';
import { LanguageCode } from '@app/common/constants/messages/select-language';
import { MessageService } from '@app/common/services';

type RequestWithContext = Request & {
  lang?: LanguageCode;
  requestId?: string;
};

type ExceptionBody = {
  code?: string;
  data?: unknown;
  details?: unknown;
  error?: string;
  errors?: unknown;
  message?: string | string[];
  statusCode?: number;
};

type DatabaseErrorMapping = {
  status: HttpStatus;
  code: string;
  messageKey: MessageKey;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.hasOwn(value, key);

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly messageService: MessageService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const databaseError = this.getDatabaseError(exception);
    const isHttp = exception instanceof HttpException;
    const exceptionResponse = isHttp ? exception.getResponse() : undefined;
    const body = isRecord(exceptionResponse)
      ? (exceptionResponse as ExceptionBody)
      : undefined;
    const status =
      databaseError?.status ??
      (isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
    const lang = request.lang || RequestContext.getLang();
    const requestId = request.requestId || RequestContext.getRequestId();
    const rawErrors = body?.errors ?? body?.details;
    const errors = rawErrors
      ? this.translateNestedMessages(rawErrors, lang)
      : null;
    const data = body && hasOwn(body, 'data') ? body.data : null;

    response.status(status).json({
      success: false,
      message: this.resolveMessage({
        body,
        databaseError,
        exception,
        exceptionResponse,
        lang,
        status,
      }),
      code: this.resolveCode({ body, databaseError, exception, status }),
      data,
      errors,
      meta: {
        requestId,
        path: request.originalUrl || request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        language: lang,
        statusCode: status,
      },
    });
  }

  private resolveMessage(options: {
    body?: ExceptionBody;
    databaseError?: DatabaseErrorMapping;
    exception: unknown;
    exceptionResponse: unknown;
    lang: LanguageCode;
    status: HttpStatus;
  }): string {
    const { body, databaseError, exception, exceptionResponse, lang, status } =
      options;

    if (databaseError) {
      return this.messageService.get(databaseError.messageKey, lang);
    }

    const rawMessage =
      body?.message ??
      (typeof exceptionResponse === 'string' ? exceptionResponse : undefined);

    if (rawMessage) {
      const translated = this.messageService.translate(rawMessage, lang);
      if (Array.isArray(translated)) {
        return translated.join(', ');
      }

      return (
        translated ??
        this.messageService.get(this.getMessageKeyByStatus(status), lang)
      );
    }

    if (!(exception instanceof HttpException) && exception instanceof Error) {
      return this.isProduction()
        ? this.messageService.get(MessageKey.GENERAL_UNKNOWN_ERROR, lang)
        : exception.message;
    }

    return this.messageService.get(this.getMessageKeyByStatus(status), lang);
  }

  private resolveCode(options: {
    body?: ExceptionBody;
    databaseError?: DatabaseErrorMapping;
    exception: unknown;
    status: HttpStatus;
  }): string {
    const { body, databaseError, exception, status } = options;

    if (exception instanceof HttpException && exception.errorCode) {
      return exception.errorCode;
    }

    if (body?.code) {
      return body.code;
    }

    if (databaseError) {
      return databaseError.code;
    }

    if (exception instanceof BadRequestException) {
      return 'BAD_REQUEST';
    }

    return HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';
  }

  private getMessageKeyByStatus(status: HttpStatus): MessageKey {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return MessageKey.GENERAL_BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return MessageKey.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return MessageKey.GENERAL_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return MessageKey.GENERAL_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return MessageKey.GENERAL_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return MessageKey.GENERAL_TOO_MANY_REQUESTS;
      default:
        return MessageKey.GENERAL_UNKNOWN_ERROR;
    }
  }

  private translateNestedMessages(value: unknown, lang: LanguageCode): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.translateNestedMessages(item, lang));
    }

    if (typeof value === 'string') {
      return this.messageService.translate(value, lang);
    }

    if (!isRecord(value)) {
      return value;
    }

    return Object.entries(value).reduce<Record<string, unknown>>(
      (translated, [key, item]) => {
        translated[key] =
          key === 'message' || key === 'messages'
            ? this.messageService.translate(
                item as string | string[] | undefined,
                lang,
              )
            : this.translateNestedMessages(item, lang);

        return translated;
      },
      {},
    );
  }

  private getDatabaseError(
    exception: unknown,
  ): DatabaseErrorMapping | undefined {
    if (!isRecord(exception) || typeof exception.code !== 'string') {
      return undefined;
    }

    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.DATABASE_DUPLICATE_KEY,
          messageKey: MessageKey.DATABASE_DUPLICATE_KEY,
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: ErrorCode.DATABASE_RECORD_NOT_FOUND,
          messageKey: MessageKey.GENERAL_NOT_FOUND,
        };
      default:
        return undefined;
    }
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
