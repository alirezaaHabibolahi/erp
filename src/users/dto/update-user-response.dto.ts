import {ApiProperty} from "@nestjs/swagger";
import {Expose} from "class-transformer";


export class UpdateUserResponseDto {
    @ApiProperty({ description: 'User phone number', example: '09123456789' })
    @Expose()
    phone: string;

    @Expose()
    username: string;

    @Expose()
    first_name: string

    @Expose()
    last_name: string

}