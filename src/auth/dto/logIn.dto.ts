import {IsPhoneNumber, IsString, Matches} from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import {MessageKey} from "@app/common";


export class LogInDto {
    @ApiProperty({ description: 'User phone number (11 digits, starts with 0)', example: '09123456789' })
    @IsString({ message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
    @Matches(/^0\d{10}$/, { message: MessageKey.VALIDATION_USER_PHONE_PATTERN })
    phone: string;

    @IsString({ message: MessageKey.VALIDATION_AUTH_PASSWORD_STRING})
    password: string;
}