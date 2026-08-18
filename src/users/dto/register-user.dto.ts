import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
    Validate,
    IsOptional,
} from 'class-validator';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import {MessageKey} from "@app/common";

/**
 * ✅ Custom decorator to check password === confirmPassword
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'Match',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return value === relatedValue;
                },
                defaultMessage() {
                    return MessageKey.USER_NOT_EQUAL_PASSWORD;
                },
            },
        });
    };
}

export class RegisterUserDto {
    @IsString({ message: MessageKey.VALIDATION_USER_USERNAME_STRING })
    @IsNotEmpty({ message: MessageKey.VALIDATION_USER_USERNAME_REQUIRED })
    @MinLength(3, { message: MessageKey.VALIDATION_USER_USERNAME_MINLENGTH })
    @MaxLength(20, { message: MessageKey.VALIDATION_USER_USERNAME_MAXLENGTH })
    username: string;

    @IsOptional()
    @IsString({ message: MessageKey.VALIDATION_USER_FIRSTNAME_STRING })
    @MaxLength(30, { message: MessageKey.VALIDATION_USER_FIRSTNAME_MAXLENGTH })
    firstName?: string;

    @IsOptional()
    @IsString({ message: MessageKey.VALIDATION_USER_LASTNAME_STRING })
    @MaxLength(30, { message: MessageKey.VALIDATION_USER_LASTNAME_MAXLENGTH })
    lastName?: string;

    @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING })
    @MinLength(8, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MINLENGTH })
    @MaxLength(32, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MAXLENGTH })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
        message: MessageKey.VALIDATION_AUTH_PASSWORD_COMPLEXITY,
    })
    password: string;

    @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_CONFIRM_STRING })
    @Validate(Match, ['password'], { message: MessageKey.VALIDATION_AUTH_PASSWORD_MISMATCH })
    confirmPassword: string;
}
