import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';
import {MessageService} from "@app/common/services";
import {MessageKey} from "@app/common/constants";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly messageService: MessageService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let data = null

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const lang = request.lang ?? 'en';

    let message: string | string[] = this.messageService.get(MessageKey.GENERAL_UNKNOWN_ERROR, lang);
    let errors: any[] = [];

    if (isHttp) {
      const res = exception.getResponse();
      data = typeof res === 'object' && res.hasOwnProperty("data") ? res['data']: null;
      // Case: BadRequestException from ValidationPipe
      if (Array.isArray(res)) {
        // res is ValidationError[]
        errors = res.map((error: ValidationError) => ({
          property: error.property,
          messages: Object.values(error.constraints || {}).map((key: string) => {
            // Translate only if key exists in MessageKey
            if (Object.values(MessageKey).includes(key as MessageKey)) {
              return this.messageService.get(key as MessageKey, lang);
            }
            return key;
          }),
        }));

        message = this.messageService.get(MessageKey.GENERAL_VALIDATION_FAILED, lang);
      }
      // Case: Normal HttpException with object response
      else if (typeof res === 'object' && res !== null && (res as any).message) {
        message = (res as any).message;
        // If message is an array of MessageKeys, translate them
        if (Array.isArray(message)) {
          message = message.map((key: string) => {
            if (Object.values(MessageKey).includes(key as MessageKey)) {
              return this.messageService.get(key as MessageKey, lang);
            }
            return key;
          });
        }
      }
      // Case: string response
      else if (typeof res === 'string') {
        message = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Handle validation error array
    if (Array.isArray(message)) {
      message = message.join(', ');
    }

    response.status(status).json({
      data: data,
      message,
      error: true,
      path: request.url,
      statusCode: status,
    });
  }
}
