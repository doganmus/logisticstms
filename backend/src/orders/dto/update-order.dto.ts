import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  loadDetails?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsUUID()
  @IsOptional()
  supplierId?: string;
}
