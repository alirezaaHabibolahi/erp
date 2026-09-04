import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '@app/common/database/postgres';
import { TokenPayload, TokenResponse } from '@app/common/dto';
import { CryptoHelper } from '@app/common/utils';
import { ErrorCode, MessageKey } from '@app/common/constants';
import { generalConfig } from '../config/general';
import { AuthRequestContext } from './interfaces';

type TokenUser = {
  id: string;
  phone: string;
  username: string | null;
};

export type AuthTokenResponse = TokenResponse & {
  userId: string;
  username: string;
  phone: string;
};

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(
    user: TokenUser,
    context: AuthRequestContext,
  ): Promise<TokenResponse> {
    const refreshToken = CryptoHelper.generateRandomToken(64);
    const config = generalConfig();
    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: CryptoHelper.hashToken(refreshToken),
        deviceName: context.deviceName,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: this.expiresAt(config.jwt.refreshTokenTtl),
      },
    });

    return {
      accessToken: await this.signAccessToken(user, session.id),
      refreshToken,
      sessionId: session.id,
    };
  }

  async refreshSession(
    sessionId: string,
    refreshToken: string,
    context: AuthRequestContext,
  ): Promise<AuthTokenResponse> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (
      !session ||
      session.isRevoked ||
      session.expiresAt <= new Date() ||
      !session.user.isActive ||
      session.user.deletedAt ||
      !session.user.username
    ) {
      throw this.invalidRefreshToken();
    }

    const currentRefreshTokenHash = CryptoHelper.hashToken(refreshToken);
    const isValid = CryptoHelper.hashEquals(
      session.refreshTokenHash,
      currentRefreshTokenHash,
    );

    if (!isValid) {
      throw this.invalidRefreshToken();
    }

    const newRefreshToken = CryptoHelper.generateRandomToken(64);
    const config = generalConfig();

    const rotated = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        userId: session.user.id,
        refreshTokenHash: currentRefreshTokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: CryptoHelper.hashToken(newRefreshToken),
        deviceName: context.deviceName ?? session.deviceName,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: this.expiresAt(config.jwt.refreshTokenTtl),
        lastUsedAt: new Date(),
      },
    });

    if (rotated.count !== 1) {
      throw this.invalidRefreshToken();
    }

    return {
      accessToken: await this.signAccessToken(session.user, session.id),
      refreshToken: newRefreshToken,
      sessionId: session.id,
      userId: session.user.id,
      username: session.user.username,
      phone: session.user.phone,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  private async signAccessToken(
    user: TokenUser,
    sessionId: string,
  ): Promise<string> {
    if (!user.username) {
      throw this.invalidRefreshToken();
    }

    const config = generalConfig();
    const payload: TokenPayload = {
      sub: user.id,
      sessionId,
      phone: user.phone,
      username: user.username,
      tokenType: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: config.jwt.accessSecret,
      expiresIn: config.jwt.accessTokenTtl as JwtSignOptions['expiresIn'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithm: 'HS256',
    });
  }

  private expiresAt(ttl: string): Date {
    return new Date(Date.now() + parseDurationToMilliseconds(ttl));
  }

  private invalidRefreshToken(): UnauthorizedException {
    return new UnauthorizedException(
      { message: MessageKey.AUTH_REFRESH_TOKEN_INVALID },
      { errorCode: ErrorCode.REFRESH_TOKEN_INVALID },
    );
  }
}

const parseDurationToMilliseconds = (value: string): number => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(value.trim());

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};
