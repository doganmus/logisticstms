import { Injectable, Scope } from '@nestjs/common';
import { Order } from '../orders/order.entity';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  async getMonthlyShipments(): Promise<any> {
    const ordersRepository = await this.tenantConnectionService.getRepository(Order);
    
    const shipments = await ordersRepository
      .createQueryBuilder('order')
      .select("to_char(order.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(order.id)', 'shipmentCount')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .getRawMany();

    return shipments.map(shipment => ({
      month: shipment.month,
      shipmentCount: parseInt(shipment.shipmentCount, 10),
    }));
  }
}
