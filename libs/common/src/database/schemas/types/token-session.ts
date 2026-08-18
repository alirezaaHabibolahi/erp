import { ObjectId } from 'mongodb';

export interface ITokenSession {
  _id?: ObjectId;
  userId: ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  isValid: boolean;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
