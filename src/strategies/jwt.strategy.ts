import { Injectable } from '@nestjs/common';
import {PassportStrategy} from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import {ConfigService} from "@nestjs/config";
import {UsersService} from "../users/users.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request: any) => request?.cookies?.Authentication,
                (request: any) => request?.Authentication,
                (request: any) => request?.headers?.Authentication,
            ]),
            secretOrKey:
              configService.get<string>('JWT_ACCESS_SECRET') ||
              configService.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: any) {
        //return this.usersService.findOne(userId);
      return payload
    }
}
