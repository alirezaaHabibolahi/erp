import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/logIn.dto';
import { VerifyUserOtpDto } from './dto/verify-user-otp.dto';
import { CurrentUser, IUser, MessageKey, Serialize, TokenPayload } from '@app/common';
import { LoginResponseDto } from './dto/logIn-respone.dto';
import { VerifyUserOtpResponseDto } from './dto/verify-user-otp-response.dto';
import { signupResponseDto } from './dto/signup-response.dto';
import { SignupDto } from './dto/signup.dto';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-ath.guard';
import { RateLimit } from '../decorators/rate-limit.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {
  }


  // @Post('signup')
  // @RateLimit({ name: 'auth-signup', limit: 3, ttl: 600 })
  // @HttpCode(HttpStatus.OK)
  // @ResponseMessage(MessageKey.USER_CREATED_SUCCESSFULLY)
  // @Serialize(signupResponseDto)
  // async signup(@Body() dto: SignupDto) {
  //   return this.authService.signupWithPhone(dto.phone);
  // }
  //
  // @Post('login')
  // @RateLimit({ name: 'auth-login', limit: 5, ttl: 600 })
  // @HttpCode(HttpStatus.OK)
  // @Serialize(LoginResponseDto)
  // async logIn(@Body() dto: LogInDto) {
  //   return this.authService.logIn(dto.phone, dto.password);
  // }
  //
  // @Post('verify')
  // @RateLimit({ name: 'auth-verify-otp', limit: 10, ttl: 600 })
  // @HttpCode(HttpStatus.OK)
  // @Serialize(VerifyUserOtpResponseDto)
  // async verify(@Body() dto: VerifyUserOtpDto) {
  //   return this.authService.verifyUserByOtpCode(dto.phone, dto.otpCode);
  // }
  //
  // @Post('resentOtp')
  // @RateLimit({ name: 'auth-resend-otp', limit: 3, ttl: 600 })
  // @ResponseMessage(MessageKey.AUTH_RESEND_OTP_CODE)
  // @HttpCode(HttpStatus.OK)
  // async resentOtp(@Body('phone') phone: string) {
  //   return this.authService.resendOtp(phone);
  // }
  //
  // @Post('refreshToken')
  // @RateLimit({ name: 'auth-refresh-token', limit: 20, ttl: 60 })
  // @HttpCode(HttpStatus.OK)
  // async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
  //   return this.authService.refreshTokens(refreshTokenDto.id, refreshTokenDto.refreshToken);
  // }
  //
  // @Post('logout')
  // @UseGuards(JwtAuthGuard)
  // logout(@CurrentUser() currentUser: TokenPayload) {
  //   return this.authService.logout(currentUser._id);
  // }

}
