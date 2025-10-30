import { IsString, IsNotEmpty, IsInt, Min, Max, Matches, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: '34ABC123', description: 'Aracin plaka numarasi' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/, { message: 'Invalid plate number format' })
  plateNumber: string;

  @ApiProperty({ example: 'Ford', description: 'Aracin markasi' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Transit', description: 'Aracin modeli' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2022, description: 'Model yili', minimum: 1990, maximum: 2030 })
  @IsInt()
  @Min(1990)
  @Max(2030)
  year: number;

  @ApiProperty({ example: 3500, description: 'Tasima kapasitesi (kg)', minimum: 100 })
  @IsInt()
  @Min(100)
  capacityKg: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Aracin bagli oldugu tedarikci kimligi' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
