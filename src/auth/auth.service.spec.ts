import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@app/common/database/postgres';
import { CryptoHelper } from '@app/common/utils';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const createSession = jest.fn();
  const prisma = {
    user: { findUnique, update },
  } as unknown as PrismaService;
  const sessions = {
    createSession,
  } as unknown as AuthSessionService;
  const service = new AuthService(prisma, sessions);

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('normalizes username and creates a persisted session', async () => {
    const user = {
      id: 'user-1',
      username: 'test_admin',
      phone: '09120000001',
      passwordHash: 'stored-hash',
      isActive: true,
      deletedAt: null,
    };
    findUnique.mockResolvedValue(user);
    update.mockResolvedValue(user);
    createSession.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'session-1',
    });
    jest.spyOn(CryptoHelper, 'compare').mockResolvedValue(true);

    await expect(
      service.login(
        { username: ' Test_Admin ', password: 'Passw0rd!123' },
        { ipAddress: '127.0.0.1' },
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'session-1',
      userId: 'user-1',
      username: 'test_admin',
      phone: '09120000001',
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { username: 'test_admin' },
    });
    expect(createSession).toHaveBeenCalledWith(user, {
      ipAddress: '127.0.0.1',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  it('returns the same unauthorized error for an unknown username', async () => {
    findUnique.mockResolvedValue(null);

    const promise = service.login(
      { username: 'missing', password: 'wrong-password' },
      {},
    );

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toMatchObject({
      response: { code: 'AUTH_INVALID_CREDENTIALS' },
    });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('does not create a session when the password is invalid', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'test_admin',
      phone: '09120000001',
      passwordHash: 'stored-hash',
      isActive: true,
      deletedAt: null,
    });
    jest.spyOn(CryptoHelper, 'compare').mockResolvedValue(false);

    await expect(
      service.login({ username: 'test_admin', password: 'wrong-password' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(createSession).not.toHaveBeenCalled();
  });
});
