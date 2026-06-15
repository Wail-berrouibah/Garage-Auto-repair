import { IsOptional, IsString, IsNumber, IsIn, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 'PERCENTAGE' })
  @IsOptional() @IsString() @IsIn(['PERCENTAGE', 'FIXED'])
  discountType?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
