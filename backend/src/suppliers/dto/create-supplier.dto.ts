import { IsString, IsNotEmpty, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'ABC Tasimacilik', description: 'Tedarikci sirket adi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Ahmet Demir', description: 'Yetkili kisinin adi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  contactName: string;

  @ApiProperty({ example: '+905551234567', description: 'Yetkilinin telefon numarasi (E.164)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]{1}[0-9]{3,14}$/, { message: 'Phone number must be in E.164 format (e.g., +905551234567)' })
  contactPhone: string;

  @ApiProperty({ example: 'info@abctasimacilik.com', description: 'Yetkilinin e-posta adresi' })
  @IsEmail({}, { message: 'Invalid email address' })
  contactEmail: string;
}
