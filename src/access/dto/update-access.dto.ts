import { IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsArray, ArrayNotEmpty, ArrayUnique, Matches } from 'class-validator';

export class UpdateAccessDto {

  @IsString()
  en_name: string;

  @IsString()
  fa_name: string;
}
