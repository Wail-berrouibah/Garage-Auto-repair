import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePoLineItemDto } from './create-po-line-item.dto';

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID('4')
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreatePoLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoLineItemDto)
  lineItems: CreatePoLineItemDto[];
}
