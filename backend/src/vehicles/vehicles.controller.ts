import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'vehicles', version: '1' })
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni arac kaydi olusturur' })
  @ApiResponse({ status: 201, description: 'Arac basariyla olusturuldu' })
  @ApiResponse({ status: 400, description: 'Gecersiz arac verisi' })
  create(@Body(ValidationPipe) createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum araclari listeler' })
  @ApiResponse({ status: 200, description: 'Arac listesi doner' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir araci getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Arac UUID degeri' })
  @ApiResponse({ status: 200, description: 'Arac bulundu' })
  @ApiResponse({ status: 404, description: 'Arac bulunamadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Araci siler' })
  @ApiParam({ name: 'id', type: 'string', description: 'Arac UUID degeri' })
  @ApiResponse({ status: 204, description: 'Arac silindi' })
  @ApiResponse({ status: 404, description: 'Arac bulunamadi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}
