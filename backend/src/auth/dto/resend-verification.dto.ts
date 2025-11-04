import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Doğrulama maili gönderilecek kullanıcı e-postası',
  })
  @IsEmail()
  email: string;
}
