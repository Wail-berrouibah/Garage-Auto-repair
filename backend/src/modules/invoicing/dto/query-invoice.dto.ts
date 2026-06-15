import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const VALID_STATUSES = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'CREDITED'] as const;

export class QueryInvoiceDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by invoice number, customer, or work order' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VALID_STATUSES })
  @IsOptional() @IsString() @IsIn(VALID_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  customerId?: string;
}
