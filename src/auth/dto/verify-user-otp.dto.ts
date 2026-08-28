import { ApiProperty } from '@nestjs/swagger';
import { MessageKey } from '@app/common';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyUserOtpDto {
  @ApiProperty({
    description: 'User phone number (11 digits, starts with 0)',
    example: '09123456789',
  })
  @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
  phone: string;

  @ApiProperty({
    description: 'One-time password sent to the user',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  otpCode: string;
}
