import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MessageKey } from '@app/common';

export class LoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'test_admin',
  })
  @IsString({ message: MessageKey.VALIDATION_USER_USERNAME_STRING })
  @IsNotEmpty({ message: MessageKey.VALIDATION_USER_USERNAME_REQUIRED })
  @MinLength(3, { message: MessageKey.VALIDATION_USER_USERNAME_MINLENGTH })
  @MaxLength(50, { message: MessageKey.VALIDATION_USER_USERNAME_MAXLENGTH })
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'Passw0rd!123',
  })
  @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING })
  @IsNotEmpty({ message: MessageKey.VALIDATION_AUTH_PASSWORD_REQUIRED })
  password: string;
}
