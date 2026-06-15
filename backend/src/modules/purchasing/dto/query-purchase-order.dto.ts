import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const VALID_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'SHIPPED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;

export class QueryPurchaseOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by PO number or supplier name' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VALID_STATUSES })
  @IsOptional() @IsString()
  @IsIn(VALID_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  supplierId?: string;
}
