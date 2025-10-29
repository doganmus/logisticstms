import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TenantRegistrationDto } from './dto/tenant-registration.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute for registration
  register(@Body(ValidationPipe) registrationDto: TenantRegistrationDto): Promise<void> {
    return this.authService.register(registrationDto);
  }

  @Post('/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login (brute force prevention)
  login(@Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    return this.authService.login(authCredentialsDto);
  }
}
