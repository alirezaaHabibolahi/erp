import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtSignOptions } from '@nestjs/jwt';
import type { Request } from 'express';
import { ErrorCode, MessageKey } from '../constants';
import { TokenPayload } from '../dto';
import { CryptoHelper } from './crypto.helper';

export type AuthTokenUser = {
  id: string;
  phone: string;
  username: string | null;
};

export type StoredPasswordResetOtp = {
  hash: string;
  userId: string;
};

export type AuthRequestWithDevice = Request & {
  headers: Request['headers'] & {
    'x-device-name'?: string | string[];
  };
};

export type AuthRequestContextPayload = {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
};

type AccessTokenConfig = {
  accessSecret: string;
  accessTokenTtl: string;
  issuer: string;
  audience: string;
};

export class AuthHelper {
  static buildRequestContext(
    request: AuthRequestWithDevice,
  ): AuthRequestContextPayload {
    return {
      ipAddress: request.ip || request.socket.remoteAddress,
      userAgent: this.firstHeaderValue(request.headers['user-agent']),
      deviceName: this.firstHeaderValue(request.headers['x-device-name']),
    };
  }

  static buildAccessTokenPayload(
    user: AuthTokenUser,
    sessionId: string,
  ): TokenPayload {
    if (!user.username) {
      throw this.invalidRefreshTokenException();
    }

    return {
      sub: user.id,
      sessionId,
      phone: user.phone,
      username: user.username,
      tokenType: 'access',
    };
  }

  static accessTokenSignOptions(config: AccessTokenConfig): JwtSignOptions {
    return {
      secret: config.accessSecret,
      expiresIn: config.accessTokenTtl as JwtSignOptions['expiresIn'],
      issuer: config.issuer,
      audience: config.audience,
      algorithm: 'HS256',
    };
  }

  static hashPasswordResetOtp(
    secret: string,
    phone: string,
    otpCode: string,
  ): string {
    return CryptoHelper.hashToken(
      `${secret}:${phone.trim()}:${otpCode.trim()}`,
    );
  }

  static parsePasswordResetOtp(value: string): StoredPasswordResetOtp | null {
    try {
      const parsed = JSON.parse(value) as Partial<StoredPasswordResetOtp>;

      if (
        typeof parsed.hash === 'string' &&
        parsed.hash &&
        typeof parsed.userId === 'string' &&
        parsed.userId
      ) {
        return {
          hash: parsed.hash,
          userId: parsed.userId,
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  static passwordResetOtpKey(phone: string): string {
    return `auth:password-reset:otp:${phone.trim()}`;
  }

  static passwordResetOtpAttemptsKey(phone: string): string {
    return `auth:password-reset:attempts:${phone.trim()}`;
  }

  static passwordResetOtpCooldownKey(phone: string): string {
    return `auth:password-reset:cooldown:${phone.trim()}`;
  }

  static invalidCredentialsException(): UnauthorizedException {
    return new UnauthorizedException(
      { message: MessageKey.AUTH_INVALID_PASS_USERNAME },
      { errorCode: ErrorCode.AUTH_INVALID_CREDENTIALS },
    );
  }

  static invalidRefreshTokenException(): UnauthorizedException {
    return new UnauthorizedException(
      { message: MessageKey.AUTH_REFRESH_TOKEN_INVALID },
      { errorCode: ErrorCode.REFRESH_TOKEN_INVALID },
    );
  }

  static invalidAccessTokenException(): UnauthorizedException {
    return new UnauthorizedException(
      { message: MessageKey.AUTH_INVALID_TOKEN },
      { errorCode: ErrorCode.AUTH_INVALID_TOKEN },
    );
  }

  static passwordMismatchException(): BadRequestException {
    return new BadRequestException(
      { message: MessageKey.VALIDATION_AUTH_PASSWORD_MISMATCH },
      { errorCode: ErrorCode.PASSWORD_CONFIRMATION_MISMATCH },
    );
  }

  static invalidPasswordResetOtpException(): BadRequestException {
    return new BadRequestException(
      { message: MessageKey.AUTH_PASSWORD_RESET_OTP_INVALID },
      { errorCode: ErrorCode.PASSWORD_RESET_OTP_INVALID },
    );
  }

  private static firstHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
