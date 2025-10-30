import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';

@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'drivers', version: '1' })
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni sofor kaydi olusturur' })
  @ApiResponse({ status: 201, description: 'Sofor basariyla olusturuldu' })
  @ApiResponse({ status: 400, description: 'Gecersiz sofor verisi' })
  create(@Body(ValidationPipe) createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum soforleri listeler' })
  @ApiResponse({ status: 200, description: 'Sofor listesi doner' })
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir soforu getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Sofor UUID degeri' })
  @ApiResponse({ status: 200, description: 'Sofor bulundu' })
  @ApiResponse({ status: 404, description: 'Sofor bulunamadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soforu siler' })
  @ApiParam({ name: 'id', type: 'string', description: 'Sofor UUID degeri' })
  @ApiResponse({ status: 204, description: 'Sofor silindi' })
  @ApiResponse({ status: 404, description: 'Sofor bulunamadi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.remove(id);
  }
}
