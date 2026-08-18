import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';


export class UpdateRoleDto {

  @IsOptional()
  @IsString()
  fa_name?: string;

  @IsOptional()
  @IsString()
  en_name?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  accesses?: string[];
}
