import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../order.entity';

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 'Istanbul, Turkiye', description: 'Opsiyonel yeni cikis konumu' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'Ankara, Turkiye', description: 'Opsiyonel yeni varis noktasi' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ example: '12 palet gida', description: 'Opsiyonel yuk detayi guncellemesi' })
  @IsString()
  @IsOptional()
  loadDetails?: string;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Siparis durum guncellemesi' })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ format: 'uuid', description: 'Opsiyonel tedarikci kimligi' })
  @IsUUID()
  @IsOptional()
  supplierId?: string;
}
