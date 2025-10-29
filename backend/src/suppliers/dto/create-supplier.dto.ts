import { IsString, IsNotEmpty, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  contactName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]{1}[0-9]{3,14}$/, { message: 'Phone number must be in E.164 format (e.g., +905551234567)' })
  contactPhone: string;

  @IsEmail({}, { message: 'Invalid email address' })
  contactEmail: string;
}
