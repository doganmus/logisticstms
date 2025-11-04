import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SuppliersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'İsim veya iletişim bilgisi araması' })
  @IsOptional()
  @IsString()
  search?: string;
}
