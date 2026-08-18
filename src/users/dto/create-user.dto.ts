import { IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsArray, ArrayNotEmpty, ArrayUnique, Matches, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageKey, ObjectId } from '@app/common';

export class CreateUserDto {
  @ApiProperty({ description: 'User phone number (11 digits, starts with 0)', example: '09123456789' })
  @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  phone: string;

  @ApiPropertyOptional({ description: 'User email address', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: MessageKey.VALIDATION_USER_EMAIL_INVALID })
  email?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_USER_FIRSTNAME_STRING })
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_USER_LASTNAME_STRING })
  last_name?: string;

  @ApiPropertyOptional({ description: 'Password (min 6 characters)', minLength: 6, example: 'secret123' })
  @IsOptional()
  @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING })
  @MinLength(6, { message: MessageKey.VALIDATION_AUTH_PASSWORD_MINLENGTH })
  password?: string;

  @ApiPropertyOptional({ description: 'Whether the user is verified', example: false })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({ description: 'User role id', type: [String] })
  @IsMongoId()
  role: ObjectId;
}