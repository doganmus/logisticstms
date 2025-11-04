import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { OrderStatus } from './order.entity';
import { OrdersQueryDto } from './dto/orders-query.dto';

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
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Sayfa numarasi' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Sayfa basina kayit' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'orderNumber', 'status'],
    description: 'Siralama alanı',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Siralama yonu',
  })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(OrderStatus) })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Siparis listesi doner' })
  findAll(@Query() query: OrdersQueryDto) {
    return this.ordersService.findAll(query);
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
