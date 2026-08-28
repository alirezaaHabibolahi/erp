import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { MessageKey } from '@app/common/constants';

export type ValidationErrorDetail = {
  field: string;
  messages: string[];
};

const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] =>
  errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const current: ValidationErrorDetail[] = error.constraints
      ? [
          {
            field,
            messages: Object.values(error.constraints),
          },
        ]
      : [];
    const children = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];

    return [...current, ...children];
  });

@Injectable()
export class I18nValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          code: 'VALIDATION_FAILED',
          message: MessageKey.GENERAL_VALIDATION_FAILED,
          errors: flattenValidationErrors(errors),
        }),
    });
  }
}
