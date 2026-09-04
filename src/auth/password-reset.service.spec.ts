import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/common/database/postgres';
import { RedisService } from '@app/common/redis/redis.service';
import { MessageService } from '@app/common/services/messageService/message.service';
import { CryptoHelper, GeneralHelper } from '@app/common/utils';
import { SmsService } from '../sms/sms.service';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  const findUnique = jest.fn();
  const findFirst = jest.fn();
  const update = jest.fn();
  const updateMany = jest.fn();
  const transaction = jest.fn();
  const exists = jest.fn();
  const set = jest.fn();
  const del = jest.fn();
  const evalScript = jest.fn();
  const send = jest.fn();
  const getMessage = jest.fn();
  const redisClient = { exists, set, del, eval: evalScript };
  const connectWithRetry = jest.fn().mockResolvedValue(redisClient);
  const prisma = {
    user: { findUnique, findFirst, update },
    authSession: { updateMany },
    $transaction: transaction,
  } as unknown as PrismaService;
  const redisService = { connectWithRetry } as unknown as RedisService;
  const smsService = { send } as unknown as SmsService;
  const messageService = { get: getMessage } as unknown as MessageService;
  const service = new PasswordResetService(
    prisma,
    redisService,
    smsService,
    messageService,
  );
  const previousOtpSecret = process.env.AUTH_PASSWORD_RESET_OTP_SECRET;

  beforeAll(() => {
    process.env.AUTH_PASSWORD_RESET_OTP_SECRET = 'test-otp-secret';
  });

  afterAll(() => {
    process.env.AUTH_PASSWORD_RESET_OTP_SECRET = previousOtpSecret;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    connectWithRetry.mockResolvedValue(redisClient);
  });

  it('returns a generic result without revealing an unknown phone', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.requestReset({ phone: '09120000009' }),
    ).resolves.toEqual({ sent: true });
    expect(connectWithRetry).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('stores a hashed OTP and sends the plaintext only to the SMS provider', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'test_admin',
      isActive: true,
      deletedAt: null,
    });
    exists.mockResolvedValue(0);
    set.mockResolvedValue('OK');
    del.mockResolvedValue(1);
    send.mockResolvedValue({ status: 1 });
    getMessage.mockReturnValue('Reset code: 123456');
    jest.spyOn(GeneralHelper, 'generateOtp').mockReturnValue('123456');

    await expect(
      service.requestReset({ phone: '09120000001' }),
    ).resolves.toEqual({ sent: true });

    const storedOtp = String(set.mock.calls[0][1]);
    expect(storedOtp).not.toContain('123456');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '09120000001',
        message: 'Reset code: 123456',
        options: expect.objectContaining({ token: '123456' }),
      }),
    );
  });

  it('resets the password and revokes every active session', async () => {
    const phone = '09120000001';
    const otpCode = '123456';
    evalScript.mockResolvedValue([
      1,
      JSON.stringify({
        userId: 'user-1',
        hash: CryptoHelper.hashToken(`test-otp-secret:${phone}:${otpCode}`),
      }),
    ]);
    findFirst.mockResolvedValue({ id: 'user-1' });
    update.mockResolvedValue({ id: 'user-1' });
    updateMany.mockResolvedValue({ count: 2 });
    transaction.mockResolvedValue([]);
    del.mockResolvedValue(3);
    jest.spyOn(CryptoHelper, 'hash').mockResolvedValue('new-password-hash');

    await expect(
      service.resetPassword({
        phone,
        otpCode,
        password: 'NewPassw0rd!123',
        confirmPassword: 'NewPassw0rd!123',
      }),
    ).resolves.toEqual({ reset: true });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ passwordHash: 'new-password-hash' }),
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRevoked: false },
      data: expect.objectContaining({ isRevoked: true }),
    });
  });

  it('rejects an invalid OTP before changing the password', async () => {
    const phone = '09120000001';
    evalScript.mockResolvedValue([
      1,
      JSON.stringify({
        userId: 'user-1',
        hash: CryptoHelper.hashToken(`test-otp-secret:${phone}:correct-code`),
      }),
    ]);

    await expect(
      service.resetPassword({
        phone,
        otpCode: '000000',
        password: 'NewPassw0rd!123',
        confirmPassword: 'NewPassw0rd!123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
