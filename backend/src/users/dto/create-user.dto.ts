import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../public-entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'operator@firma.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Operatör Kullanıcı' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: UserRole, default: UserRole.OPERATOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: 'GeciciParola123!',
    required: false,
    description: 'Opsiyonel olarak anında atanacak geçici parola',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  temporaryPassword?: string;
}
