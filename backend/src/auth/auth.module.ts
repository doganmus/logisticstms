import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './constants';
import { User } from '../public-entities/user.entity';
import { Tenant } from '../public-entities/tenant.entity';
import { TenantModule } from '../tenant/tenant.module';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { MailService } from '../common/services/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, PasswordResetToken, EmailVerificationToken], 'public'), // Uses the public connection
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION || '24h') as any },
    }),
    TenantModule,
  ],
  providers: [AuthService, JwtStrategy, MailService],
  controllers: [AuthController],
  exports: [JwtModule], // Export JwtModule so it can be used in TenantMiddleware
})
export class AuthModule {}
