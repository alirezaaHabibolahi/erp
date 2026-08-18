import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {

  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @Expose()
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @Expose()
  refreshToken: string;

  @ApiProperty({ description: 'User phone number', example: '09123456789' })
  @Expose()
  phone: string;
}