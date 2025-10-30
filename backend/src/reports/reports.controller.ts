import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-shipments')
  @ApiOperation({ summary: 'Aylik sevkiyat istatistiklerini doner' })
  @ApiResponse({ status: 200, description: 'Aylik sevkiyat verileri' })
  getMonthlyShipments() {
    return this.reportsService.getMonthlyShipments();
  }
}
