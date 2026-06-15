import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

export class QuerySupplierDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, code, or contact' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
