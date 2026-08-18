import { Connection, Schema } from 'mongoose';

import { ModelParent } from '@/models/Base/baseModelParent';
import { ITokenSession } from '@/types/token-session';

export class TokenSessionSchema extends ModelParent<ITokenSession> {
  constructor(connection: Connection) {
    const schema = new Schema<ITokenSession>(
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'user',
          required: true,
        },
        refreshTokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        isValid: { type: Boolean, default: true },
        lastUsedAt: { type: Date, default: null },
        revokedAt: { type: Date, default: null },
      },
      { timestamps: true },
    );

    schema.index({ userId: 1 }, { unique: true });
    schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    super(connection, 'token_session', 'token_sessions', schema);
  }
}
