import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthCredentialsDto {
  @ApiProperty({ example: 'admin@abclojistik.com', description: 'Kullanici e-postasi' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Kullanici sifresi' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
