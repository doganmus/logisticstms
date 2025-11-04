import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { User, UserRole } from '../public-entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { addMinutes } from '../utils/date';
import { MailService } from '../common/services/mail.service';

type SanitizedUser = Omit<User, 'passwordHash'>;

interface RequesterContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User, 'public')
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken, 'public')
    private readonly resetTokensRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken, 'public')
    private readonly emailTokensRepository: Repository<EmailVerificationToken>,
    private readonly mailService: MailService,
  ) {}

  async findAll(tenantUuid: string): Promise<SanitizedUser[]> {
    const tenantId = this.ensureTenant(tenantUuid);
    const users = await this.usersRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    return users.map(this.sanitizeUser);
  }

  async findOne(id: string, tenantUuid: string): Promise<SanitizedUser> {
    const tenantId = this.ensureTenant(tenantUuid);
    const user = await this.usersRepository.findOne({
      where: { id, tenantId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async create(
    createUserDto: CreateUserDto,
    tenantUuid: string,
  ): Promise<{ user: SanitizedUser; resetToken: string; generatedPassword?: string }> {
    const tenantId = this.ensureTenant(tenantUuid);

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const temporaryPassword = createUserDto.temporaryPassword ?? this.generateTemporaryPassword();
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(temporaryPassword, salt);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      tenantId,
      role: createUserDto.role ?? UserRole.OPERATOR,
      passwordHash,
      isEmailVerified: false,
      emailVerifiedAt: null,
    });

    const saved = await this.usersRepository.save(user);
    const resetTokenValue = randomUUID();

    const resetToken = this.resetTokensRepository.create({
      userId: saved.id,
      token: resetTokenValue,
      expiresAt: addMinutes(new Date(), 60),
    });
    await this.resetTokensRepository.save(resetToken);

    await this.issueVerificationEmail(saved);

    const sanitized = this.sanitizeUser(saved);

    return {
      user: sanitized,
      resetToken: resetTokenValue,
      generatedPassword: createUserDto.temporaryPassword ? undefined : temporaryPassword,
    };
  }

  async update(
    id: string,
    updateDto: UpdateUserDto,
    requester: RequesterContext,
    tenantUuid: string,
  ): Promise<SanitizedUser> {
    const tenantId = this.ensureTenant(tenantUuid);
    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSelf = requester.id === user.id;
    const requesterIsAdmin = requester.role === UserRole.ADMIN;

    if (!requesterIsAdmin && !isSelf) {
      throw new ForbiddenException('You do not have permission to manage this user.');
    }

    if (updateDto.role && !requesterIsAdmin) {
      throw new ForbiddenException('Only admins can change roles.');
    }

    let shouldResendVerification = false;

    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
      user.email = updateDto.email;
      user.isEmailVerified = false;
      user.emailVerifiedAt = null;
      shouldResendVerification = true;
    }

    if (updateDto.name) {
      user.name = updateDto.name;
    }

    if (updateDto.role) {
      user.role = updateDto.role;
    }

    const saved = await this.usersRepository.save(user);

    if (shouldResendVerification) {
      await this.issueVerificationEmail(saved);
    }

    return this.sanitizeUser(saved);
  }

  async remove(id: string, tenantUuid: string, requesterId?: string): Promise<void> {
    const tenantId = this.ensureTenant(tenantUuid);
    if (requesterId && requesterId === id) {
      throw new BadRequestException('You cannot delete your own user.');
    }

    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.delete(id);
  }

  async resendVerification(
    id: string,
    requester: RequesterContext,
    tenantUuid: string,
  ): Promise<void> {
    const tenantId = this.ensureTenant(tenantUuid);
    const user = await this.usersRepository.findOne({ where: { id, tenantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSelf = requester.id === user.id;
    const requesterIsAdmin = requester.role === UserRole.ADMIN;
    if (!requesterIsAdmin && !isSelf) {
      throw new ForbiddenException('You do not have permission to resend verification for this user.');
    }

    if (user.isEmailVerified) {
      return;
    }

    await this.issueVerificationEmail(user);
  }

  private sanitizeUser(user: User): SanitizedUser {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private async issueVerificationEmail(user: User): Promise<void> {
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

  private ensureTenant(tenantUuid: string | undefined): string {
    if (!tenantUuid) {
      throw new UnauthorizedException('Tenant context missing in request.');
    }
    return tenantUuid;
  }

  private generateTemporaryPassword(): string {
    const base = randomUUID().replace(/-/g, '');
    return base.slice(0, 8) + 'Aa1!';
  }
}
