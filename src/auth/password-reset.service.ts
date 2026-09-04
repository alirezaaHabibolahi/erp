import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/common/database/postgres';
import { ErrorCode, MessageKey } from '@app/common/constants';
import { RedisService } from '@app/common/redis/redis.service';
import { MessageService } from '@app/common/services/messageService/message.service';
import { CryptoHelper, GeneralHelper } from '@app/common/utils';
import { SmsService } from '../sms/sms.service';
import { generalConfig } from '../config/general';
import { ForgotPasswordDto, ResetPasswordDto } from './dto';

type StoredPasswordResetOtp = {
  hash: string;
  userId: string;
};

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
    const cooldownKey = this.cooldownKey(phone);
    const isCoolingDown = await redis.exists(cooldownKey);

    if (isCoolingDown) {
      return { sent: true };
    }

    const config = generalConfig();
    const otpCode = GeneralHelper.generateOtp(
      config.auth.passwordResetOtpLength,
    );

    await redis.set(
      this.otpKey(phone),
      JSON.stringify({
        hash: this.hashOtp(phone, otpCode),
        userId: user.id,
      } satisfies StoredPasswordResetOtp),
      'EX',
      config.auth.passwordResetOtpTtlSeconds,
    );
    await redis.set(
      cooldownKey,
      '1',
      'EX',
      config.auth.passwordResetOtpCooldownSeconds,
    );
    await redis.del(this.attemptsKey(phone));

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
      await redis.del(this.otpKey(phone));
      this.logger.error(
        'Password reset SMS delivery failed.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException(
        { message: MessageKey.VALIDATION_AUTH_PASSWORD_MISMATCH },
        { errorCode: ErrorCode.PASSWORD_CONFIRMATION_MISMATCH },
      );
    }

    const phone = dto.phone.trim();
    const redis = await this.redisService.connectWithRetry(
      generalConfig().redis.url,
    );
    const config = generalConfig();
    const [attemptStatus, storedRaw] = (await redis.eval(
      REGISTER_OTP_ATTEMPT_SCRIPT,
      2,
      this.otpKey(phone),
      this.attemptsKey(phone),
      String(config.auth.passwordResetOtpTtlSeconds),
      String(config.auth.passwordResetOtpMaxAttempts),
    )) as [number, string];

    if (attemptStatus !== 1 || !storedRaw) {
      throw this.invalidOtp();
    }

    const stored = this.parseStoredOtp(storedRaw);
    const isValid = CryptoHelper.hashEquals(
      stored.hash,
      this.hashOtp(phone, dto.otpCode.trim()),
    );

    if (!isValid) {
      throw this.invalidOtp();
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
      throw this.invalidOtp();
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
      this.otpKey(phone),
      this.attemptsKey(phone),
      this.cooldownKey(phone),
    );

    return { reset: true };
  }

  private parseStoredOtp(value: string): StoredPasswordResetOtp {
    try {
      const parsed = JSON.parse(value) as StoredPasswordResetOtp;
      if (parsed.hash && parsed.userId) {
        return parsed;
      }
    } catch {
      throw this.invalidOtp();
    }

    throw this.invalidOtp();
  }

  private invalidOtp(): BadRequestException {
    return new BadRequestException(
      { message: MessageKey.AUTH_PASSWORD_RESET_OTP_INVALID },
      { errorCode: ErrorCode.PASSWORD_RESET_OTP_INVALID },
    );
  }

  private hashOtp(phone: string, otpCode: string): string {
    return CryptoHelper.hashToken(
      `${generalConfig().auth.passwordResetOtpSecret}:${phone}:${otpCode}`,
    );
  }

  private otpKey(phone: string): string {
    return `auth:password-reset:otp:${phone}`;
  }

  private attemptsKey(phone: string): string {
    return `auth:password-reset:attempts:${phone}`;
  }

  private cooldownKey(phone: string): string {
    return `auth:password-reset:cooldown:${phone}`;
  }
}
