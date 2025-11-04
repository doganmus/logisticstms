import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'f0339884-ccd7-42fb-a3f0-2d94f2cff1ff',
    description: 'Kullanıcıya gönderilen sıfırlama tokenı',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'YeniSifre123!',
    description: 'Yeni şifre (8-50 karakter)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
