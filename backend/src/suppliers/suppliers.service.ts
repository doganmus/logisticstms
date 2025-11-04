
import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { PaginationQueryDto, SortOrder } from '../common/dto/pagination-query.dto';
import { SuppliersQueryDto } from './dto/suppliers-query.dto';

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

  async findAll(
    query?: SuppliersQueryDto,
  ): Promise<{ data: Supplier[]; meta?: any }> {
    // For development, use raw query to work around tenant schema metadata issues
    const tenantId = this.tenantConnectionService.getTenantId();
    if (tenantId === 'public') {
      const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);
      const qb = suppliersRepository.createQueryBuilder('supplier');
      if (query?.search) {
        qb.where(
          '(supplier.name ILIKE :search OR supplier."contactName" ILIKE :search OR supplier."contactEmail" ILIKE :search)',
          { search: `%${query.search}%` },
        );
      }
      qb.orderBy('supplier.createdAt', query?.sortOrder ?? SortOrder.DESC);
      if (query) {
        qb.skip((query.page - 1) * query.limit).take(query.limit);
      }
      const [data, total] = await qb.getManyAndCount();
      return {
        data,
        meta: query
          ? {
              totalItems: total,
              itemCount: data.length,
              itemsPerPage: query.limit,
              totalPages: Math.ceil(total / query.limit) || 1,
              currentPage: query.page,
            }
          : undefined,
      };
    }

    // Use raw query for tenant schemas
    const params: any[] = [];
    const where: string[] = [];
    let idx = 1;

    if (query?.search) {
      where.push(`(name ILIKE $${idx} OR "contactName" ILIKE $${idx} OR "contactEmail" ILIKE $${idx})`);
      params.push(`%${query.search}%`);
      idx += 1;
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = `ORDER BY "createdAt" ${query?.sortOrder ?? SortOrder.DESC}`;
    const paginationClause = query ? `LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}` : '';

    const dataRows = await this.tenantConnectionService.query<TenantSupplierRow[]>(
      `SELECT * FROM "${tenantId}"."suppliers" ${whereClause} ${orderClause} ${paginationClause}`,
      params,
    );

    const data = dataRows.map((row) => ({
      id: row.id,
      name: row.name,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vehicles: [], // Not loaded in raw query
    }));

    if (!query) {
      return { data };
    }

    const countRows = await this.tenantConnectionService.query<{ count: string }[]>(
      `SELECT COUNT(*)::int as count FROM "${tenantId}"."suppliers" ${whereClause}`,
      params,
    );

    const total = Number(countRows[0]?.count ?? data.length);

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
        currentPage: query.page,
      },
    };
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
