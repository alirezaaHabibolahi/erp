import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MessageKey } from '@app/common/constants';
import { CurrentUser } from '@app/common/decorators';
import type { TokenPayload } from '@app/common/dto';
import { AuthHelper, AuthRequestWithDevice } from '@app/common/utils';
import { Public } from '../decorators/public.decorator';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { PasswordResetService } from './password-reset.service';
import {
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authSessionService: AuthSessionService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @RateLimit({ name: 'auth-login', limit: 10, ttl: 300 })
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() dto: LoginDto, @Req() request: AuthRequestWithDevice) {
    return {
      data: await this.authService.login(
        dto,
        AuthHelper.buildRequestContext(request),
      ),
      messageKey: MessageKey.AUTH_LOGIN_SUCCESS,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @RateLimit({ name: 'auth-refresh', limit: 30, ttl: 60 })
  @ApiOperation({ summary: 'Rotate refresh token and issue access token' })
  @ApiOkResponse({ type: LoginResponseDto })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: AuthRequestWithDevice,
  ) {
    return {
      data: await this.authSessionService.refreshSession(
        dto.sessionId,
        dto.refreshToken,
        AuthHelper.buildRequestContext(request),
      ),
      messageKey: MessageKey.AUTH_REFRESH_SUCCESS,
    };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Revoke current auth session' })
  async logout(@CurrentUser('sessionId') sessionId: string) {
    await this.authSessionService.revokeSession(sessionId);

    return {
      data: { revoked: true },
      messageKey: MessageKey.AUTH_LOGOUT_SUCCESS,
    };
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: TokenPayload) {
    return {
      data: await this.authService.getMe(user.sub),
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @RateLimit({ name: 'auth-forgot-password', limit: 5, ttl: 900 })
  @ApiOperation({ summary: 'Send password reset OTP by SMS' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return {
      data: await this.passwordResetService.requestReset(dto),
      messageKey: MessageKey.AUTH_PASSWORD_RESET_OTP_SENT,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @RateLimit({ name: 'auth-reset-password', limit: 10, ttl: 900 })
  @ApiOperation({ summary: 'Reset password using phone and SMS OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return {
      data: await this.passwordResetService.resetPassword(dto),
      messageKey: MessageKey.AUTH_PASSWORD_RESET_SUCCESS,
    };
  }
}
