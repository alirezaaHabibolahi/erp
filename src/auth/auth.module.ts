import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@app/common';
import { RedisModule } from '@app/common/redis/redis.module';
import { SmsModule } from '../sms/sms.module';
import { AccessModule } from '../access/access.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { PasswordResetService } from './password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    SmsModule,
    AccessModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    PasswordResetService,
    JwtStrategy,
  ],
  exports: [AuthService, AuthSessionService, PasswordResetService],
})
export class AuthModule {}
