import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SuppliersService } from '../suppliers/suppliers.service';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
    private readonly suppliersService: SuppliersService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const { supplierId, ...rest } = createVehicleDto;
    const vehiclesRepository = await this.tenantConnectionService.getRepository(Vehicle);
    
    let vehicleData: any = {
      ...rest,
      isExternal: !!supplierId,
    };

    if (supplierId) {
      const supplier = await this.suppliersService.findOne(supplierId);
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${supplierId}" not found`);
      }
      vehicleData.supplier = supplier;
    }

    const vehicle = vehiclesRepository.create(vehicleData);
    return await vehiclesRepository.save(vehicle) as unknown as Vehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    const vehiclesRepository = await this.tenantConnectionService.getRepository(Vehicle);
    return vehiclesRepository.find({ relations: ['supplier'] });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehiclesRepository = await this.tenantConnectionService.getRepository(Vehicle);
    const vehicle = await vehiclesRepository.findOne({ where: { id }, relations: ['supplier'] });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    const vehiclesRepository = await this.tenantConnectionService.getRepository(Vehicle);
    const result = await vehiclesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle with ID "${id}" not found`);
    }
  }
}
