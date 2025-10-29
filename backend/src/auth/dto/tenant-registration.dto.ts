import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class TenantRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  userName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
