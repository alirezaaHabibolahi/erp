import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  fa_name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  en_name: string;

  @IsArray()
  @IsMongoId({ each: true })
  accesses: string[];
}
