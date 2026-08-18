import {ApiProperty} from "@nestjs/swagger";
import {Expose} from "class-transformer";


export class signupResponseDto {
    @ApiProperty({ description: 'User phone number', example: '09123456789' })
    @Expose()
    phone: string;
}