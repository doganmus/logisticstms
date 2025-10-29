import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]{1}[0-9]{3,14}$/, { message: 'Phone number must be in E.164 format' })
  phone: string;
}
