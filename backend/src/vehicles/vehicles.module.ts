import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [SuppliersModule, TenantModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
