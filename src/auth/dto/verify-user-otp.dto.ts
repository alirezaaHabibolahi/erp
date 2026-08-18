import {IsNotEmpty, IsPhoneNumber, IsString, Matches} from "class-validator";
import { ApiProperty } from '@nestjs/swagger';


export class VerifyUserOtpDto {

    @ApiProperty({ description: 'User phone number (11 digits, starts with 0)', example: '09123456789' })
    @IsString()
    @Matches(/^0\d{10}$/, { message: 'phone must be 11 digits and start with 0' })
    phone: string

    @ApiProperty({ description: 'One-time password sent to the user', example: '123456' })
    @IsString()
    @IsNotEmpty()
    otpCode: string
}