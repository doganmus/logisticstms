import { Body, Controller, HttpCode, Post, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantRegistrationDto } from './dto/tenant-registration.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Yeni tenant ve ilk admin kullanicisini kaydeder' })
  @ApiResponse({ status: 201, description: 'Tenant kaydi tamamlandi' })
  @ApiResponse({ status: 400, description: 'Gecersiz kayit bilgileri' })
  @ApiBody({ type: TenantRegistrationDto })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute for registration
  register(@Body(ValidationPipe) registrationDto: TenantRegistrationDto): Promise<void> {
    return this.authService.register(registrationDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'JWT erisim tokeni uretir' })
  @ApiResponse({ status: 200, description: 'Giris basarili', schema: { example: { accessToken: 'jwt-token' } } })
  @ApiResponse({ status: 401, description: 'Kimlik dogrulama basarisiz' })
  @ApiBody({ type: AuthCredentialsDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login (brute force prevention)
  login(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    return this.authService.login(authCredentialsDto);
  }

  @Post('/forgot-password')
  @ApiOperation({ summary: 'Sifre sifirlama talebi olusturur' })
  @ApiResponse({ status: 202, description: 'Sifre sifirlama maili gonderildi' })
  @ApiBody({ type: ForgotPasswordDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(202)
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto): Promise<{ status: string }> {
    await this.authService.requestPasswordReset(forgotPasswordDto);
    return { status: 'ok' };
  }

  @Post('/reset-password')
  @ApiOperation({ summary: 'Token ile sifre sifirlama islemini tamamlar' })
  @ApiResponse({ status: 204, description: 'Sifre basariyla sifirlandi' })
  @ApiBody({ type: ResetPasswordDto })
  @HttpCode(204)
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('/verify-email')
  @ApiOperation({ summary: 'Email doğrulama tokenını işler' })
  @ApiResponse({ status: 204, description: 'Email doğrulandı' })
  @ApiBody({ type: VerifyEmailDto })
  @HttpCode(204)
  async verifyEmail(@Body(ValidationPipe) verifyEmailDto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('/resend-verification')
  @ApiOperation({ summary: 'Email doğrulama bağlantısını tekrar gönderir' })
  @ApiResponse({ status: 202, description: 'Doğrulama maili yeniden gönderildi' })
  @ApiBody({ type: ResendVerificationDto })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(202)
  async resendVerification(@Body(ValidationPipe) resendVerificationDto: ResendVerificationDto): Promise<{ status: string }> {
    await this.authService.resendVerification(resendVerificationDto);
    return { status: 'ok' };
  }
}
