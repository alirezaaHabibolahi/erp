import {ApiProperty} from "@nestjs/swagger";
import {Expose} from "class-transformer";


export class RegisterUserResponseDto {
    @Expose()
    phone: string;

    @Expose()
    username: string;

    @Expose()
    first_name: string

    @Expose()
    last_name: string

}