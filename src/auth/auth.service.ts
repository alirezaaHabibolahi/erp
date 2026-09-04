import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@app/common/database/postgres';
import { CryptoHelper } from '@app/common/utils';
import { ErrorCode, MessageKey } from '@app/common/constants';
import { AuthRequestContext } from './interfaces';
import { AuthSessionService } from './auth-session.service';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async login(dto: LoginDto, context: AuthRequestContext) {
    const username = this.normalizeUsername(dto.username);
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (
      !user ||
      !user.isActive ||
      user.deletedAt ||
      !user.passwordHash ||
      !user.username
    ) {
      throw this.invalidCredentials();
    }

    const passwordMatches = await CryptoHelper.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const tokenResponse = await this.authSessionService.createSession(
      user,
      context,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokenResponse,
      userId: user.id,
      username: user.username,
      phone: user.phone,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        phone: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      throw this.invalidCredentials();
    }

    return user;
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException(
      { message: MessageKey.AUTH_INVALID_PASS_USERNAME },
      { errorCode: ErrorCode.AUTH_INVALID_CREDENTIALS },
    );
  }
}
