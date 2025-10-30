import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ example: 'Mehmet Kaya', description: 'Surucunun adi soyadi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '34ABC1234', description: 'Ehliyet numarasi' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({ example: '+905551234567', description: 'E.164 formatinda telefon numarasi' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]{1}[0-9]{3,14}$/, { message: 'Phone number must be in E.164 format' })
  phone: string;
}
