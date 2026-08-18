import { IsBoolean, IsEmail, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageKey, ObjectId } from '@app/common';

export class UpdateUserDto {
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

  @IsMongoId()
  @IsOptional()
  role: ObjectId;
}
