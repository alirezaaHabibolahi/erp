import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  refreshToken: string;

  @ApiProperty({
    description: 'Auth session id',
    example: 'clx1f2abc0000u2j7wz9r4s2e',
  })
  @Expose()
  sessionId: string;

  @ApiProperty({
    description: 'Authenticated user id',
    example: 'clx1f2abc0001u2j7q6b8n0va',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'User phone number', example: '09123456789' })
  @Expose()
  phone: string;
}
