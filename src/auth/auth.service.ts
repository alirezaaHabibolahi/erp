import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CryptoHelper,
  IUser,
  MessageKey,
  MessageService,
  TokenResponse,
} from '@app/common';
import { UsersService } from '../users/users.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { TokenPayload } from '@app/common/dto/token-payload.interface';
import { LoginResponseDto } from './dto/logIn-respone.dto';
import { VerifyUserOtpResponseDto } from './dto/verify-user-otp-response.dto';
import { TokenSessionService } from './token-session.service';

interface AuthTokenUser {
  _id: { toHexString(): string };
  role?: {
    _id: { toString(): string };
    en_name?: string;
  };
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  accesses: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly messageService: MessageService,
    private readonly tokenSessions: TokenSessionService,
  ) {}

  async signupWithPhone(phone: string) {
    let userDocument: IUser | null = await this.usersService.findByPhone(phone);
    if (userDocument) {
      throw new BadRequestException(
        this.messageService.get(MessageKey.USER_ALREADY_EXISTS),
      );
    }
    userDocument = await this.createUser(phone);
    await this.usersService.createUserOtpCodeAndSendSms(userDocument._id.toString());
    return userDocument;
  }

  async logIn(phone: string, password: string): Promise<LoginResponseDto> {
    const userDocument = await this.usersService.findByPhone(phone);
    const passwordMatches =
      !!userDocument?.password &&
      (await CryptoHelper.compare(password, userDocument.password));

    if (!passwordMatches) {
      throw new NotFoundException(
        this.messageService.get(MessageKey.AUTH_INVALID_PASS_USERNAME),
      );
    }

    const generatedTokens = await this.handleTokenProcess(userDocument);
    return {
      accessToken: generatedTokens.accessToken,
      refreshToken: generatedTokens.refreshToken,
      phone: userDocument.phone,
    };
  }

  async verifyUserByOtpCode(
    phone: string,
    otpCode: string,
  ): Promise<VerifyUserOtpResponseDto> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (
      user.otp_code !== otpCode ||
      (user.expire_otp_code_date &&
        user.expire_otp_code_date.getTime() < Date.now())
    ) {
      throw new BadRequestException(
        this.messageService.get(MessageKey.AUTH_OTP_CODE_IS_NOT_VALID),
      );
    }

    if (!user.is_verified) {
      await this.usersService.update(user._id.toString(), {
        is_verified: true,
      });
    }

    const generatedTokens = await this.handleTokenProcess(user);
    return {
      accessToken: generatedTokens.accessToken,
      refreshToken: generatedTokens.refreshToken,
    };
  }

  async resendOtp(phone: string) {
    const userDocument = await this.usersService.findByPhone(phone);
    if (!userDocument) {
      throw new NotFoundException(
        this.messageService.get(MessageKey.USER_NOT_FOUND),
      );
    }
    await this.usersService.createUserOtpCodeAndSendSms(userDocument._id.toString());
    return { phone: userDocument.phone };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenResponse> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      if (
        payload._id !== userId ||
        !(await this.tokenSessions.isCurrent(userId, refreshToken))
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.handleTokenProcess(user, refreshToken);
  }

  async logout(userId: string) {
    await this.tokenSessions.revoke(userId);
    return { message: 'Logged out successfully' };
  }

  private async handleTokenProcess(
    userDocument: IUser,
    currentRefreshToken?: string,
  ): Promise<TokenResponse> {
    const [userWithRoleAndAccesses] =
      (await this.usersService.getUserWithRolesAndAccesses(
        userDocument._id.toString(),
      )) as AuthTokenUser[];
    const generatedTokens = await this.generateTokens(userWithRoleAndAccesses);
    const userId = userDocument._id.toString();
    const expiresAt = this.getRefreshTokenExpiresAt();

    if (currentRefreshToken) {
      const rotated = await this.tokenSessions.rotateCurrent(
        userId,
        currentRefreshToken,
        generatedTokens.refreshToken,
        expiresAt,
      );
      if (!rotated) {
        throw new UnauthorizedException('Refresh token is no longer valid');
      }
    } else {
      await this.tokenSessions.createOrRotate(
        userId,
        generatedTokens.refreshToken,
        expiresAt,
      );
    }

    return generatedTokens;
  }

  private async createUser(phone: string): Promise<IUser> {
    const user = plainToInstance(CreateUserDto, { phone });
    const errors = await validate(user);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return this.usersService.create(user);
  }

  private async generateTokens(user: AuthTokenUser): Promise<TokenResponse> {
    const tokenPayload: TokenPayload = {
      _id: user._id.toHexString(),
      roleId: user.role?._id.toString() || '',
      role: user.role?.en_name || '',
      is_active: user.is_active,
      is_verified: user.is_verified,
      is_admin: user.is_admin,
      accesses: user.accesses,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.getAccessTokenLifetimeSeconds(),
    });
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.getRefreshTokenLifetimeSeconds(),
    });

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.getAccessTokenSecret(),
    });
  }

  async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.getRefreshTokenSecret(),
    });
  }

  private getAccessTokenSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }

  private getRefreshTokenSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.getRefreshTokenLifetimeSeconds() * 1_000);
  }

  private getAccessTokenLifetimeSeconds(): number {
    return this.getLifetimeSeconds(
      this.configService.get<string>('JWT_ACCESS_SECRET_EXPIRE_TIME') ||
        this.configService.get<string>('JWT_EXPIRES_IN') ||
        '1d',
      86_400,
    );
  }

  private getRefreshTokenLifetimeSeconds(): number {
    return this.getLifetimeSeconds(
      this.configService.get<string>('JWT_REFRESH_SECRET_EXPIRE_TIME') || '7d',
      604_800,
    );
  }

  private getLifetimeSeconds(lifetime: string, fallback: number): number {
    const match = /^(\d+)([smhdw])$/.exec(lifetime);
    const unitSeconds: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3_600,
      d: 86_400,
      w: 604_800,
    };
    return match ? Number(match[1]) * unitSeconds[match[2]] : fallback;
  }
}
