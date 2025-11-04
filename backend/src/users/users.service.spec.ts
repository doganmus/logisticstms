import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from '../public-entities/user.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { MailService } from '../common/services/mail.service';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const userRepoMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const resetRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
});

const emailTokenRepoMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: ReturnType<typeof userRepoMock>;
  let resetTokensRepository: ReturnType<typeof resetRepoMock>;
  let emailTokensRepository: ReturnType<typeof emailTokenRepoMock>;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User, 'public'),
          useValue: userRepoMock(),
        },
        {
          provide: getRepositoryToken(PasswordResetToken, 'public'),
          useValue: resetRepoMock(),
        },
        {
          provide: getRepositoryToken(EmailVerificationToken, 'public'),
          useValue: emailTokenRepoMock(),
        },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User, 'public'));
    resetTokensRepository = module.get(getRepositoryToken(PasswordResetToken, 'public'));
    emailTokensRepository = module.get(getRepositoryToken(EmailVerificationToken, 'public'));
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated tenant users without password hash', async () => {
    usersRepository.find.mockResolvedValueOnce([
      {
        id: 'user-1',
        email: 'user@tenant.com',
        name: 'Test User',
        tenantId: 'tenant-uuid',
        role: UserRole.ADMIN,
        passwordHash: 'hashed',
        isEmailVerified: true,
        emailVerifiedAt: new Date('2026-03-03T10:00:00Z'),
      },
    ]);

    const result = await service.findAll('tenant-uuid');

    expect(result).toEqual([
      {
        id: 'user-1',
        email: 'user@tenant.com',
        name: 'Test User',
        tenantId: 'tenant-uuid',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        emailVerifiedAt: new Date('2026-03-03T10:00:00Z'),
      },
    ]);
    expect(usersRepository.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-uuid' },
      order: { name: 'ASC' },
    });
  });

  it('creates a user, generates reset token and hides password hash', async () => {
    usersRepository.findOne.mockResolvedValueOnce(null);
    usersRepository.create.mockImplementation((entity) => entity);
    usersRepository.save.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@tenant.com',
      name: 'New User',
      tenantId: 'tenant-uuid',
      role: UserRole.OPERATOR,
      passwordHash: 'hashed-password',
      isEmailVerified: false,
      emailVerifiedAt: null,
    });
    resetTokensRepository.create.mockImplementation((entity) => entity);

    const result = await service.create(
      {
        email: 'new@tenant.com',
        name: 'New User',
        role: UserRole.OPERATOR,
      },
      'tenant-uuid',
    );

    expect(usersRepository.create).toHaveBeenCalled();
    expect(usersRepository.save).toHaveBeenCalled();
    expect(resetTokensRepository.create).toHaveBeenCalled();
    expect(resetTokensRepository.save).toHaveBeenCalled();
    expect(emailTokensRepository.create).toHaveBeenCalled();
    expect(emailTokensRepository.save).toHaveBeenCalled();
    expect(mailService.sendMail).toHaveBeenCalled();
    expect(result.user).toMatchObject({
      email: 'new@tenant.com',
      name: 'New User',
      role: UserRole.OPERATOR,
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.resetToken).toBeDefined();
  });

  it('allows operator to update own profile but not change role', async () => {
    const storedUser = {
      id: 'user-1',
      email: 'operator@tenant.com',
      name: 'Operator User',
      tenantId: 'tenant-uuid',
      role: UserRole.OPERATOR,
      passwordHash: 'hashed',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    };
    usersRepository.findOne.mockResolvedValueOnce(storedUser);
    usersRepository.save.mockImplementation(async (entity) => entity);

    const updated = await service.update(
      'user-1',
      { name: 'Updated Name' },
      { id: 'user-1', role: UserRole.OPERATOR },
      'tenant-uuid',
    );

    expect(usersRepository.save).toHaveBeenCalledWith({
      ...storedUser,
      name: 'Updated Name',
    });
    expect(updated.name).toBe('Updated Name');

    usersRepository.findOne.mockResolvedValueOnce(storedUser);
    await expect(
      service.update(
        'user-1',
        { role: UserRole.ADMIN },
        { id: 'user-1', role: UserRole.OPERATOR },
        'tenant-uuid',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin to change role and triggers verification on email change', async () => {
    const storedUser = {
      id: 'user-2',
      email: 'user@tenant.com',
      name: 'User Person',
      tenantId: 'tenant-uuid',
      role: UserRole.OPERATOR,
      passwordHash: 'hashed',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    };
    usersRepository.findOne
      .mockResolvedValueOnce(storedUser) // fetch target user
      .mockResolvedValueOnce(null); // uniqueness check for email
    usersRepository.save.mockImplementation(async (entity) => entity);

    const updated = await service.update(
      'user-2',
      { email: 'new@tenant.com', role: UserRole.ADMIN },
      { id: 'admin-1', role: UserRole.ADMIN },
      'tenant-uuid',
    );

    expect(usersRepository.save).toHaveBeenCalledWith({
      ...storedUser,
      email: 'new@tenant.com',
      role: UserRole.ADMIN,
      isEmailVerified: false,
      emailVerifiedAt: null,
    });
    expect(emailTokensRepository.create).toHaveBeenCalled();
    expect(mailService.sendMail).toHaveBeenCalled();
    expect(updated.email).toBe('new@tenant.com');
    expect(updated.role).toBe(UserRole.ADMIN);
    expect(updated.isEmailVerified).toBe(false);
  });

  it('allows admin to resend verification for unverified user', async () => {
    const storedUser = {
      id: 'user-3',
      email: 'pending@tenant.com',
      name: 'Pending User',
      tenantId: 'tenant-uuid',
      role: UserRole.OPERATOR,
      passwordHash: 'hashed',
      isEmailVerified: false,
      emailVerifiedAt: null,
    };
    usersRepository.findOne.mockResolvedValueOnce(storedUser);

    await service.resendVerification(
      'user-3',
      { id: 'admin-1', role: UserRole.ADMIN },
      'tenant-uuid',
    );

    expect(emailTokensRepository.create).toHaveBeenCalled();
    expect(mailService.sendMail).toHaveBeenCalled();
  });

  it('prevents non-admin from managing other users', async () => {
    const storedUser = {
      id: 'user-4',
      email: 'other@tenant.com',
      name: 'Other User',
      tenantId: 'tenant-uuid',
      role: UserRole.OPERATOR,
      passwordHash: 'hashed',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    };
    usersRepository.findOne.mockResolvedValue(storedUser);

    await expect(
      service.update(
        'user-4',
        { name: 'New Name' },
        { id: 'user-1', role: UserRole.OPERATOR },
        'tenant-uuid',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.resendVerification(
        'user-4',
        { id: 'user-1', role: UserRole.OPERATOR },
        'tenant-uuid',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
