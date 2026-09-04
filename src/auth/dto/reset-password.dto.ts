import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MessageKey } from '@app/common';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'User phone number that received the reset OTP',
    example: '09123456789',
  })
  @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  phone: string;

  @ApiProperty({
    description: 'OTP code sent by SMS',
    example: '123456',
  })
  @IsString({ message: MessageKey.VALIDATION_AUTH_OTP_STRING })
  @IsNotEmpty({ message: MessageKey.VALIDATION_AUTH_OTP_REQUIRED })
  @Matches(/^\d{4,10}$/, { message: MessageKey.VALIDATION_AUTH_OTP_PATTERN })
  otpCode: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassw0rd!123',
  })
  @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING })
  @IsNotEmpty({ message: MessageKey.VALIDATION_AUTH_PASSWORD_REQUIRED })
  @MinLength(8, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MINLENGTH })
  @MaxLength(128, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MAXLENGTH })
  password: string;

  @ApiProperty({
    description: 'New password confirmation',
    example: 'NewPassw0rd!123',
  })
  @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_CONFIRM_STRING })
  @IsNotEmpty({ message: MessageKey.VALIDATION_AUTH_PASSWORD_REQUIRED })
  confirmPassword: string;
}
