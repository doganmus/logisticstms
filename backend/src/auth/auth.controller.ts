import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantRegistrationDto } from './dto/tenant-registration.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

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
}
