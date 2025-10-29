import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  destination: string;

  @IsString()
  @IsNotEmpty()
  loadDetails: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
