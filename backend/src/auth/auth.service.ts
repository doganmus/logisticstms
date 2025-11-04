import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../public-entities/user.entity';
import { Tenant } from '../public-entities/tenant.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TenantRegistrationDto } from './dto/tenant-registration.dto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { randomUUID } from 'node:crypto';
import { addMinutes, isBefore } from '../utils/date';
import { MailService } from '../common/services/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Injectable()
export class AuthService {
  constructor(
    // Inject repositories from the public connection
    @InjectRepository(User, 'public')
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant, 'public')
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(PasswordResetToken, 'public')
    private resetTokensRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken, 'public')
    private emailTokensRepository: Repository<EmailVerificationToken>,
    private jwtService: JwtService,
    private tenantConnectionService: TenantConnectionService,
    private readonly mailService: MailService,
  ) {}

  async register(registrationDto: TenantRegistrationDto): Promise<void> {
    const { companyName, email, password, userName } = registrationDto;

    const userExists = await this.usersRepository.findOneBy({ email });
    if (userExists) {
      throw new ConflictException('Email already exists');
    }

    const schemaName = companyName.toLowerCase().replace(/\s+/g, '_') + `_${Date.now()}`;
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newTenant = this.tenantsRepository.create({ name: companyName, schema: schemaName });
    await this.tenantsRepository.save(newTenant);

    const newUser = this.usersRepository.create({
      email,
      passwordHash,
      name: userName,
      tenantId: newTenant.id,
      role: UserRole.ADMIN,
    });
    const savedUser = await this.usersRepository.save(newUser);

    // Use TenantConnectionService to create the schema
    await this.tenantConnectionService.createTenantSchema(schemaName);

    await this.sendVerificationEmail(savedUser);
  }

  async login(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    const { email, password } = authCredentialsDto;
    // Find user in the public schema
    const user = await this.usersRepository.findOne({ where: { email }, relations: ['tenant'] });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (!user.isEmailVerified) {
        throw new ForbiddenException('Email address is not verified.');
      }
      const payload = {
        email: user.email,
        sub: user.id,
        tenantId: user.tenant.schema,
        tenantUuid: user.tenant.id,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  async requestPasswordReset({ email }: ForgotPasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // We do not leak whether the email exists to prevent enumeration
      return;
    }

    await this.resetTokensRepository.update(
      { userId: user.id, usedAt: null },
      { usedAt: new Date() },
    );

    const tokenValue = randomUUID();
    const token = this.resetTokensRepository.create({
      userId: user.id,
      token: tokenValue,
      expiresAt: addMinutes(new Date(), 15),
    });

    await this.resetTokensRepository.save(token);

    await this.mailService.sendMail({
      to: email,
      subject: 'Şifre sıfırlama talebiniz',
      template: 'password-reset',
      html: this.buildPasswordResetEmail(tokenValue),
    });
  }

  async resetPassword({ token, password }: ResetPasswordDto): Promise<void> {
    const resetToken = await this.resetTokensRepository.findOne({
      where: { token },
    });

    if (!resetToken) {
      throw new NotFoundException('Reset token not found or already used.');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token was already consumed.');
    }

    if (isBefore(resetToken.expiresAt, new Date())) {
      throw new BadRequestException('Reset token expired.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: resetToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const salt = await bcrypt.genSalt();
    user.passwordHash = await bcrypt.hash(password, salt);
    await this.usersRepository.save(user);

    resetToken.usedAt = new Date();
    await this.resetTokensRepository.save(resetToken);
  }

  async verifyEmail({ token }: VerifyEmailDto): Promise<void> {
    const verification = await this.emailTokensRepository.findOne({ where: { token } });
    if (!verification) {
      throw new NotFoundException('Verification token not found.');
    }

    if (verification.usedAt) {
      throw new BadRequestException('Verification token already used.');
    }

    if (isBefore(verification.expiresAt, new Date())) {
      throw new BadRequestException('Verification token expired.');
    }

    const user = await this.usersRepository.findOne({ where: { id: verification.userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.usersRepository.save(user);

    verification.usedAt = new Date();
    await this.emailTokensRepository.save(verification);
  }

  async resendVerification({ email }: ResendVerificationDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // do not leak user existence
      return;
    }

    if (user.isEmailVerified) {
      return;
    }

    await this.emailTokensRepository.update(
      { userId: user.id, usedAt: null },
      { usedAt: new Date() },
    );

    const tokenValue = randomUUID();
    const token = this.emailTokensRepository.create({
      userId: user.id,
      token: tokenValue,
      expiresAt: addMinutes(new Date(), 60 * 24),
    });
    await this.emailTokensRepository.save(token);

    await this.mailService.sendMail({
      to: email,
      subject: 'Email doğrulama bağlantınız',
      template: 'email-verification',
      html: this.buildVerificationEmail(tokenValue),
    });
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    await this.emailTokensRepository.update(
      { userId: user.id, usedAt: null },
      { usedAt: new Date() },
    );

    const tokenValue = randomUUID();
    const token = this.emailTokensRepository.create({
      userId: user.id,
      token: tokenValue,
      expiresAt: addMinutes(new Date(), 60 * 24),
    });

    await this.emailTokensRepository.save(token);

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Email adresinizi doğrulayın',
      template: 'email-verification',
      html: this.buildVerificationEmail(tokenValue),
    });
  }

  private buildVerificationEmail(token: string): string {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:3001';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    return `
      <h1>LogisticsTMS</h1>
      <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Bağlantı 24 saat içinde geçerliliğini kaybeder.</p>
    `;
  }

  private buildPasswordResetEmail(token: string): string {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:3001';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    return `
      <h1>LogisticsTMS</h1>
      <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bağlantı 15 dakika içinde geçerliliğini kaybeder.</p>
    `;
  }
}
