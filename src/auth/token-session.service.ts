import { Injectable } from '@nestjs/common';
import { CryptoHelper } from '@app/common';

import { TokenSessionRepository } from './token-session.repository';

@Injectable()
export class TokenSessionService {
  constructor(private readonly tokenSessions: TokenSessionRepository) {}

  async createOrRotate(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const refreshTokenHash = await CryptoHelper.hash(refreshToken);
    await this.tokenSessions.createOrUpdate(
      userId,
      refreshTokenHash,
      expiresAt,
    );
  }

  async isCurrent(userId: string, refreshToken: string): Promise<boolean> {
    const session = await this.tokenSessions.findActiveByUserId(userId);
    return (
      !!session && CryptoHelper.compare(refreshToken, session.refreshTokenHash)
    );
  }

  async rotateCurrent(
    userId: string,
    currentRefreshToken: string,
    nextRefreshToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const session = await this.tokenSessions.findActiveByUserId(userId);
    if (
      !session ||
      !(await CryptoHelper.compare(
        currentRefreshToken,
        session.refreshTokenHash,
      ))
    ) {
      return false;
    }

    const nextTokenHash = await CryptoHelper.hash(nextRefreshToken);
    return this.tokenSessions.replaceIfCurrent(
      userId,
      session.refreshTokenHash,
      nextTokenHash,
      expiresAt,
    );
  }

  async revoke(userId: string): Promise<void> {
    await this.tokenSessions.revokeByUserId(userId);
  }
}
