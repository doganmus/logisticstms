import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { OrderStatus } from './order.entity';
import { OrdersQueryDto } from './dto/orders-query.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let tenantConnectionService: jest.Mocked<TenantConnectionService>;

  const createQueryBuilderMock = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return qb;
  };

  beforeEach(async () => {
    tenantConnectionService = {
      getRepository: jest.fn(),
      getTenantId: jest.fn(),
      query: jest.fn(),
      createTenantSchema: jest.fn(),
      tenantSchemaExists: jest.fn(),
      dropTenantSchema: jest.fn(),
    } as unknown as jest.Mocked<TenantConnectionService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: TenantConnectionService,
          useValue: tenantConnectionService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('applies filtering and sorting options when listing orders', async () => {
    const qb = createQueryBuilderMock();
    tenantConnectionService.getRepository.mockResolvedValue({
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any);

    const query: OrdersQueryDto = {
      page: 2,
      limit: 20,
      sortBy: 'orderNumber',
      sortOrder: 'ASC',
      status: OrderStatus.PENDING,
      supplierId: 'supplier-1',
      search: 'istanbul',
      dateFrom: '2026-03-01',
      dateTo: '2026-03-05',
    } as OrdersQueryDto;

    await service.findAll(query);

    expect(tenantConnectionService.getRepository).toHaveBeenCalled();
    expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('order.supplier', 'supplier');
    expect(qb.orderBy).toHaveBeenCalledWith('order.orderNumber', 'ASC');
    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(qb.andWhere).toHaveBeenCalledWith('order.status = :status', { status: OrderStatus.PENDING });
    expect(qb.andWhere).toHaveBeenCalledWith('supplier.id = :supplierId', { supplierId: 'supplier-1' });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(order.orderNumber ILIKE :search OR order.origin ILIKE :search OR order.destination ILIKE :search)',
      { search: '%istanbul%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt >= :dateFrom', { dateFrom: '2026-03-01' });
    expect(qb.andWhere).toHaveBeenCalledWith('order.createdAt <= :dateTo', { dateTo: '2026-03-05' });
  });
});
