import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@app/common/database/postgres';
import { TokenPayload } from '@app/common/dto';
import { AuthHelper } from '@app/common/utils';
import { generalConfig } from '../../config/general';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: generalConfig().jwt.accessSecret,
      issuer: generalConfig().jwt.issuer,
      audience: generalConfig().jwt.audience,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (payload.tokenType !== 'access') {
      throw AuthHelper.invalidAccessTokenException();
    }

    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      !session.user.isActive ||
      session.user.deletedAt ||
      !session.user.username
    ) {
      throw AuthHelper.invalidAccessTokenException();
    }

    return {
      sub: session.user.id,
      sessionId: session.id,
      phone: session.user.phone,
      username: session.user.username,
      tokenType: 'access',
    };
  }
}
