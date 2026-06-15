import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsNumber, IsIn, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInvoiceLineDto } from './create-invoice-line.dto';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID('4')
  workOrderId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ example: 'PERCENTAGE' })
  @IsOptional() @IsString() @IsIn(['PERCENTAGE', 'FIXED'])
  discountType?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceLineDto], minItems: 1 })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lineItems: CreateInvoiceLineDto[];
}
