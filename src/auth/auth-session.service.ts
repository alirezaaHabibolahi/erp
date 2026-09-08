import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/common/database/postgres';
import { TokenResponse } from '@app/common/dto';
import {
  AuthHelper,
  AuthTokenUser,
  CryptoHelper,
  DateHelper,
} from '@app/common/utils';
import { generalConfig } from '../config/general';
import { AuthRequestContext } from './interfaces';

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
    user: AuthTokenUser,
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
        expiresAt: DateHelper.expirationFromNow(config.jwt.refreshTokenTtl),
      },
    });

    return {
      accessToken: await this.jwtService.signAsync(
        AuthHelper.buildAccessTokenPayload(user, session.id),
        AuthHelper.accessTokenSignOptions(config.jwt),
      ),
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
      throw AuthHelper.invalidRefreshTokenException();
    }

    const currentRefreshTokenHash = CryptoHelper.hashToken(refreshToken);
    const isValid = CryptoHelper.hashEquals(
      session.refreshTokenHash,
      currentRefreshTokenHash,
    );

    if (!isValid) {
      throw AuthHelper.invalidRefreshTokenException();
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
        expiresAt: DateHelper.expirationFromNow(config.jwt.refreshTokenTtl),
        lastUsedAt: new Date(),
      },
    });

    if (rotated.count !== 1) {
      throw AuthHelper.invalidRefreshTokenException();
    }

    return {
      accessToken: await this.jwtService.signAsync(
        AuthHelper.buildAccessTokenPayload(session.user, session.id),
        AuthHelper.accessTokenSignOptions(config.jwt),
      ),
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
}
