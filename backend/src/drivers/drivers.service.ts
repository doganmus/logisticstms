import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Driver } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

@Injectable()
export class DriversService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const driversRepository = await this.tenantConnectionService.getRepository(Driver);
    const driver = driversRepository.create(createDriverDto);
    return driversRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    const driversRepository = await this.tenantConnectionService.getRepository(Driver);
    return driversRepository.find();
  }

  async findOne(id: string): Promise<Driver> {
    const driversRepository = await this.tenantConnectionService.getRepository(Driver);
    const driver = await driversRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    return driver;
  }

  async remove(id: string): Promise<void> {
    const driversRepository = await this.tenantConnectionService.getRepository(Driver);
    const result = await driversRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
  }
}
