import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni siparis olusturur' })
  @ApiResponse({ status: 201, description: 'Siparis basariyla olusturuldu' })
  @ApiResponse({ status: 400, description: 'Gecersiz siparis verisi' })
  create(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum siparisleri listeler' })
  @ApiResponse({ status: 200, description: 'Siparis listesi doner' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir siparisi getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Siparis UUID degeri' })
  @ApiResponse({ status: 200, description: 'Siparis bulundu' })
  @ApiResponse({ status: 404, description: 'Siparis bulunamadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Siparis bilgilerini gunceller' })
  @ApiParam({ name: 'id', type: 'string', description: 'Siparis UUID degeri' })
  @ApiResponse({ status: 200, description: 'Siparis guncellendi' })
  @ApiResponse({ status: 404, description: 'Siparis bulunamadi' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body(ValidationPipe) updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Siparisi siler' })
  @ApiParam({ name: 'id', type: 'string', description: 'Siparis UUID degeri' })
  @ApiResponse({ status: 204, description: 'Siparis silindi' })
  @ApiResponse({ status: 404, description: 'Siparis bulunamadi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
