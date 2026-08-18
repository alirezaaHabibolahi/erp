import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { PhoneLocalStrategy } from '../strategies/local.strategy';
import { MessageService } from '@app/common';
import { SmsService } from '../sms/sms.service';
import { SmsProviderFactory } from '../sms/providers/sms.provider-factory';
import { SmsIrProvider } from '../sms/providers/sms-ir.provider';
import { KavenegarProvider } from '../sms/providers/kavenegar.provider';
import { RoleModule } from '../role/role.module';
import { TokenSessionRepository } from './token-session.repository';
import { TokenSessionService } from './token-session.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PhoneLocalStrategy,
    TokenSessionRepository,
    TokenSessionService,
  ],
})
export class AuthModule {
}
