import { Inject, Injectable } from '@nestjs/common';
import { ITokenSession, Models } from '@app/common';

@Injectable()
export class TokenSessionRepository {
  constructor(@Inject('ModelService') private readonly models: Models) {}

  private get tokenSessionModel() {
    return this.models.tokenSession.model;
  }

  async createOrUpdate(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<ITokenSession> {
    return this.tokenSessionModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            refreshTokenHash,
            expiresAt,
            isValid: true,
            lastUsedAt: new Date(),
            revokedAt: null,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async findActiveByUserId(userId: string): Promise<ITokenSession | null> {
    return this.tokenSessionModel
      .findOne({
        userId,
        isValid: true,
        expiresAt: { $gt: new Date() },
      })
      .lean();
  }

  async replaceIfCurrent(
    userId: string,
    currentTokenHash: string,
    nextTokenHash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const result = await this.tokenSessionModel.updateOne(
      {
        userId,
        refreshTokenHash: currentTokenHash,
        isValid: true,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          refreshTokenHash: nextTokenHash,
          expiresAt,
          lastUsedAt: new Date(),
          revokedAt: null,
        },
      },
    );
    return result.modifiedCount === 1;
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.tokenSessionModel.updateOne(
      { userId, isValid: true },
      { $set: { isValid: false, revokedAt: new Date() } },
    );
  }
}
