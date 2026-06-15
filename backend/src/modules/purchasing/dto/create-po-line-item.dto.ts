import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePoLineItemDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  stockItemId?: string;

  @ApiProperty({ example: 'OIL-5W30-1L' })
  @IsString() @MaxLength(100)
  partNumber: string;

  @ApiProperty({ example: 'Engine Oil 5W-30 1L' })
  @IsString() @MaxLength(500)
  description: string;

  @ApiProperty({ example: 10 })
  @IsNumber() @Min(1)
  quantityOrdered: number;

  @ApiProperty({ example: 8.50 })
  @IsNumber() @Min(0)
  unitPrice: number;
}
