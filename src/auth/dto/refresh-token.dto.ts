import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Auth session id',
    example: 'clx1f2abc0000u2j7wz9r4s2e',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Opaque refresh token returned by login or token refresh',
    example: '8f28d8f5...128_hex_characters',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
