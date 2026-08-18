import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {UsersService} from '../users/users.service';

@Injectable()
export class PhoneLocalStrategy extends PassportStrategy(Strategy, 'phone-local') {
    constructor(private readonly usersService: UsersService) {
        // tell passport-local to use "phone" as the field name
        super({ usernameField: 'phone' });
    }

    async validate(phone: string, password: string) {
        console.log(`phone is:${phone}`)

        return await this.usersService.findByPhone(phone);
    }
}
