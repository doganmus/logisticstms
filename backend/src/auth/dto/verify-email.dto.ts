import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '7c68ccb7-4d61-4b90-8a9d-2c5efc9835b6',
    description: 'Email doğrulama tokenı',
  })
  @IsString()
  @MinLength(10)
  token: string;
}
