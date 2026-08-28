import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MessageKey } from '@app/common';

export class SignupDto {
  @ApiProperty({
    description: 'User phone number (11 digits, starts with 0)',
    example: '09123456789',
  })
  @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  phone: string;

  @ApiProperty({
    description: 'Optional password for password-based login',
    example: 'Passw0rd!123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING })
  @MinLength(8, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MINLENGTH })
  @MaxLength(128, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MAXLENGTH })
  password?: string;

  @ApiProperty({
    description: 'Optional first name',
    example: 'Ali',
    required: false,
  })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_USER_FIRSTNAME_STRING })
  @MaxLength(80, { message: MessageKey.VALIDATION_USER_FIRSTNAME_MAXLENGTH })
  firstName?: string;

  @ApiProperty({
    description: 'Optional last name',
    example: 'Ahmadi',
    required: false,
  })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_USER_LASTNAME_STRING })
  @MaxLength(80, { message: MessageKey.VALIDATION_USER_LASTNAME_MAXLENGTH })
  lastName?: string;
}
