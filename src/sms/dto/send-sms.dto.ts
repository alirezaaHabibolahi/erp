import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendSmsDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsNotEmpty()
    to: string;

    @IsOptional()
    @IsArray()
    additionalPhones?: string[];
}
