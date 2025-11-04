import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Reset bağlantısı almak isteyen kullanıcının e-posta adresi',
  })
  @IsEmail()
  email: string;
}
