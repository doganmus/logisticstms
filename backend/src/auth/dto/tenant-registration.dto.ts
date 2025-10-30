import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TenantRegistrationDto {
  @ApiProperty({ example: 'ABC Lojistik', description: 'Kurumsal musteri/unvan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @ApiProperty({ example: 'Admin User', description: 'Ilk yonetici adi' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  userName: string;

  @ApiProperty({ example: 'admin@abclojistik.com', description: 'Yonetici e-posta adresi' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Sifre (8-50 karakter)' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
