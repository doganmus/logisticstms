import { Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Supplier } from '../suppliers/supplier.entity';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { PaginationQueryDto, SortOrder } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { OrdersQueryDto } from './dto/orders-query.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}`;
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    
    const order = ordersRepository.create({ ...createOrderDto, orderNumber });
    return ordersRepository.save(order);
  }

  async findAll(query: OrdersQueryDto): Promise<PaginatedResult<Order>> {
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);

    const { page, limit, sortBy, sortOrder, status, search, supplierId, dateFrom, dateTo } = query;
    const qb = ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .orderBy(`order.${sortBy}`, sortOrder ?? SortOrder.DESC)
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (supplierId) {
      qb.andWhere('supplier.id = :supplierId', { supplierId });
    }

    if (search) {
      qb.andWhere(
        '(order.orderNumber ILIKE :search OR order.origin ILIKE :search OR order.destination ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (dateFrom) {
      qb.andWhere('order.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('order.createdAt <= :dateTo', { dateTo });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    const order = await ordersRepository.findOne({ where: { id }, relations: ['supplier'] });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const { supplierId, ...orderData } = updateOrderDto;
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    const suppliersRepository = await this.tenantConnectionService.getRepository(Supplier);

    const order = await ordersRepository.preload({
      id: id,
      ...orderData,
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    if (supplierId) {
      const supplier = await suppliersRepository.findOneBy({ id: supplierId });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${supplierId}" not found`);
      }
      order.supplier = supplier;
      order.status = OrderStatus.ASSIGNED;
    }

    return ordersRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    const result = await ordersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
  }
}
