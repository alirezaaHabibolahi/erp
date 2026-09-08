import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common/database/postgres';
import { MessageKey } from '@app/common/constants';
import { RedisService } from '@app/common/redis/redis.service';
import { MessageService } from '@app/common/services/messageService/message.service';
import { AuthHelper, CryptoHelper, GeneralHelper } from '@app/common/utils';
import { SmsService } from '../sms/sms.service';
import { generalConfig } from '../config/general';
import { ForgotPasswordDto, ResetPasswordDto } from './dto';

const REGISTER_OTP_ATTEMPT_SCRIPT = `
local stored = redis.call('GET', KEYS[1])
if not stored then
  return {0, ''}
end

local attempts = redis.call('INCR', KEYS[2])
if attempts == 1 then
  redis.call('EXPIRE', KEYS[2], ARGV[1])
end

if attempts > tonumber(ARGV[2]) then
  redis.call('DEL', KEYS[1], KEYS[2])
  return {-1, ''}
end

return {1, stored}
`;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly smsService: SmsService,
    private readonly messageService: MessageService,
  ) {}

  async requestReset(dto: ForgotPasswordDto): Promise<{ sent: true }> {
    const phone = dto.phone.trim();
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.isActive || user.deletedAt || !user.username) {
      return { sent: true };
    }

    const redis = await this.redisService.connectWithRetry(
      generalConfig().redis.url,
    );
    const cooldownKey = AuthHelper.passwordResetOtpCooldownKey(phone);
    const isCoolingDown = await redis.exists(cooldownKey);

    if (isCoolingDown) {
      return { sent: true };
    }

    const config = generalConfig();
    const otpCode = GeneralHelper.generateOtp(
      config.auth.passwordResetOtpLength,
    );

    await redis.set(
      AuthHelper.passwordResetOtpKey(phone),
      JSON.stringify({
        hash: AuthHelper.hashPasswordResetOtp(
          config.auth.passwordResetOtpSecret,
          phone,
          otpCode,
        ),
        userId: user.id,
      }),
      'EX',
      config.auth.passwordResetOtpTtlSeconds,
    );
    await redis.set(
      cooldownKey,
      '1',
      'EX',
      config.auth.passwordResetOtpCooldownSeconds,
    );
    await redis.del(AuthHelper.passwordResetOtpAttemptsKey(phone));

    try {
      await this.smsService.send({
        to: phone,
        message: this.messageService.get(
          MessageKey.AUTH_PASSWORD_RESET_OTP_SMS,
          undefined,
          { code: otpCode },
        ),
        templateId: config.sms.passwordResetTemplateId,
        params: [
          { name: 'CODE', value: otpCode },
          { name: 'code', value: otpCode },
        ],
        options: {
          token: otpCode,
          template: config.sms.passwordResetTemplateName,
        },
      });
    } catch (error) {
      await redis.del(AuthHelper.passwordResetOtpKey(phone));
      this.logger.error(
        'Password reset SMS delivery failed.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    if (dto.password !== dto.confirmPassword) {
      throw AuthHelper.passwordMismatchException();
    }

    const phone = dto.phone.trim();
    const redis = await this.redisService.connectWithRetry(
      generalConfig().redis.url,
    );
    const config = generalConfig();
    const [attemptStatus, storedRaw] = (await redis.eval(
      REGISTER_OTP_ATTEMPT_SCRIPT,
      2,
      AuthHelper.passwordResetOtpKey(phone),
      AuthHelper.passwordResetOtpAttemptsKey(phone),
      String(config.auth.passwordResetOtpTtlSeconds),
      String(config.auth.passwordResetOtpMaxAttempts),
    )) as [number, string];

    if (attemptStatus !== 1 || !storedRaw) {
      throw AuthHelper.invalidPasswordResetOtpException();
    }

    const stored = AuthHelper.parsePasswordResetOtp(storedRaw);

    if (!stored) {
      throw AuthHelper.invalidPasswordResetOtpException();
    }

    const isValid = CryptoHelper.hashEquals(
      stored.hash,
      AuthHelper.hashPasswordResetOtp(
        config.auth.passwordResetOtpSecret,
        phone,
        dto.otpCode,
      ),
    );

    if (!isValid) {
      throw AuthHelper.invalidPasswordResetOtpException();
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: stored.userId,
        phone,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw AuthHelper.invalidPasswordResetOtpException();
    }

    const passwordHash = await CryptoHelper.hash(dto.password);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: now,
          isVerified: true,
        },
      }),
      this.prisma.authSession.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: now,
        },
      }),
    ]);
    await redis.del(
      AuthHelper.passwordResetOtpKey(phone),
      AuthHelper.passwordResetOtpAttemptsKey(phone),
      AuthHelper.passwordResetOtpCooldownKey(phone),
    );

    return { reset: true };
  }
}
