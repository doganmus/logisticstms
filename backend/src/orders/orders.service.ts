import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Supplier } from '../suppliers/supplier.entity';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

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

  async findAll(): Promise<Order[]> {
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    return ordersRepository.find({ relations: ['supplier'] });
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
