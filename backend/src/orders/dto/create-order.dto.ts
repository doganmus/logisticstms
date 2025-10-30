import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Istanbul, Turkiye', description: 'Yuklemenin alinacagi nokta' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  origin: string;

  @ApiProperty({ example: 'Ankara, Turkiye', description: 'Teslimat adresi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  destination: string;

  @ApiProperty({ example: '10 palet kuru gida', description: 'Tasima icin yuk detaylari' })
  @IsString()
  @IsNotEmpty()
  loadDetails: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Varsa baglantili tedarikci kimligi' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
