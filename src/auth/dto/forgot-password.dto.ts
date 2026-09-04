import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { MessageKey } from '@app/common';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User phone number that receives the reset OTP',
    example: '09123456789',
  })
  @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  phone: string;
}
