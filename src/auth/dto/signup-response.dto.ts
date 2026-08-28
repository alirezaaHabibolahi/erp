import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SignupResponseDto {
  @ApiProperty({
    description: 'Created user id',
    example: 'clx1f2abc0001u2j7q6b8n0va',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'User phone number', example: '09123456789' })
  @Expose()
  phone: string;
}
