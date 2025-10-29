
import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

type TenantSupplierRow = {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class SuppliersService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      const supplier = suppliersRepository.create(createSupplierDto);
      return suppliersRepository.save(supplier);
    }

    // Use raw query for tenant schemas
    const { name, contactName, contactPhone, contactEmail } = createSupplierDto;
    const result = await this.tenantConnectionService.query<TenantSupplierRow[]>(
      `INSERT INTO "${tenantId}"."suppliers" (name, "contactName", "contactPhone", "contactEmail") VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, contactName, contactPhone, contactEmail],
    );

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vehicles: [],
    };
  }

  async findAll(): Promise<Supplier[]> {
    // For development, use raw query to work around tenant schema metadata issues
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      return suppliersRepository.find();
    }

    // Use raw query for tenant schemas
    const result = await this.tenantConnectionService.query<TenantSupplierRow[]>(
      `SELECT * FROM "${tenantId}"."suppliers" ORDER BY "createdAt" DESC`,
    );
    return result.map((row) => ({
      id: row.id,
      name: row.name,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vehicles: [], // Not loaded in raw query
    }));
  }

  async findOne(id: string): Promise<Supplier> {
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      const supplier = await suppliersRepository.findOneBy({ id });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${id}" not found`);
      }
      return supplier;
    }

    // Use raw query for tenant schemas
    const result = await this.tenantConnectionService.query<TenantSupplierRow[]>(
      `SELECT * FROM "${tenantId}"."suppliers" WHERE id = $1`,
      [id],
    );
    if (result.length === 0) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }
    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vehicles: [], // Not loaded in raw query
    };
  }

  async update(id: string, updateSupplierDto: any): Promise<Supplier> {
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      await suppliersRepository.update(id, updateSupplierDto);
      return this.findOne(id);
    }

    // Use raw query for tenant schemas
    const { name, contactName, contactPhone, contactEmail } = updateSupplierDto;
    await this.tenantConnectionService.query(
      `UPDATE "${tenantId}"."suppliers" SET name = $1, "contactName" = $2, "contactPhone" = $3, "contactEmail" = $4, "updatedAt" = NOW() WHERE id = $5`,
      [name, contactName, contactPhone, contactEmail, id],
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      await suppliersRepository.delete(id);
      return;
    }

    // Use raw query for tenant schemas
    await this.tenantConnectionService.query(
      `DELETE FROM "${tenantId}"."suppliers" WHERE id = $1`,
      [id],
    );
  }
}
