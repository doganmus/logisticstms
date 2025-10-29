import { IsString, IsNotEmpty, IsInt, Min, Max, Matches, IsOptional, IsUUID } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/, { message: 'Invalid plate number format' })
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1990)
  @Max(2030)
  year: number;

  @IsInt()
  @Min(100)
  capacityKg: number;

  @IsOptional()
  @IsUUID()
  supplierId?: string;
}
