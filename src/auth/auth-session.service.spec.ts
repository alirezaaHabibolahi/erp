import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { vi } from 'vitest';
import { PrismaService } from '@app/common/database/postgres';
import { CryptoHelper } from '@app/common/utils';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const create = vi.fn();
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  const signAsync = vi.fn();
  const prisma = {
    authSession: { create, findUnique, updateMany },
  } as unknown as PrismaService;
  const jwtService = { signAsync } as unknown as JwtService;
  const service = new AuthSessionService(prisma, jwtService);
  const user = {
    id: 'user-1',
    username: 'test_admin',
    phone: '09120000001',
    isActive: true,
    deletedAt: null,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('stores only the refresh token hash when creating a session', async () => {
    create.mockResolvedValue({ id: 'session-1' });
    signAsync.mockResolvedValue('access-token');

    const result = await service.createSession(user, {
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(128);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: CryptoHelper.hashToken(result.refreshToken),
      }),
    });
    expect(create.mock.calls[0][0].data.refreshTokenHash).not.toBe(
      result.refreshToken,
    );
  });

  it('atomically rotates a valid refresh token', async () => {
    const oldRefreshToken = 'old-refresh-token';
    const oldHash = CryptoHelper.hashToken(oldRefreshToken);
    findUnique.mockResolvedValue({
      id: 'session-1',
      refreshTokenHash: oldHash,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      deviceName: 'old-device',
      user,
    });
    updateMany.mockResolvedValue({ count: 1 });
    signAsync.mockResolvedValue('new-access-token');

    const result = await service.refreshSession('session-1', oldRefreshToken, {
      deviceName: 'new-device',
    });

    expect(result.refreshToken).not.toBe(oldRefreshToken);
    expect(updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: 'session-1',
        refreshTokenHash: oldHash,
        isRevoked: false,
      }),
      data: expect.objectContaining({
        refreshTokenHash: CryptoHelper.hashToken(result.refreshToken),
        deviceName: 'new-device',
      }),
    });
  });

  it('rejects refresh when another request already rotated the token', async () => {
    const oldRefreshToken = 'old-refresh-token';
    findUnique.mockResolvedValue({
      id: 'session-1',
      refreshTokenHash: CryptoHelper.hashToken(oldRefreshToken),
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      deviceName: null,
      user,
    });
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.refreshSession('session-1', oldRefreshToken, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });
});
