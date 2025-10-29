import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../public-entities/user.entity';
import { Tenant } from '../public-entities/tenant.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TenantRegistrationDto } from './dto/tenant-registration.dto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

@Injectable()
export class AuthService {
  constructor(
    // Inject repositories from the public connection
    @InjectRepository(User, 'public')
    private usersRepository: Repository<User>,
    @InjectRepository(Tenant, 'public')
    private tenantsRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private tenantConnectionService: TenantConnectionService,
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
    });
    await this.usersRepository.save(newUser);

    // Use TenantConnectionService to create the schema
    await this.tenantConnectionService.createTenantSchema(schemaName);
  }

  async login(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    const { email, password } = authCredentialsDto;
    // Find user in the public schema
    const user = await this.usersRepository.findOne({ where: { email }, relations: ['tenant'] });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const payload = { email: user.email, sub: user.id, tenantId: user.tenant.schema };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
}
