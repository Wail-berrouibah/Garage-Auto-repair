import { IsString, IsOptional, IsNumber, IsUUID, Min, Max, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  warehouseId?: string;

  @ApiProperty({ example: 'OIL-5W30-1L' })
  @IsString() @MinLength(1) @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional() @IsString() @MaxLength(100)
  partNumber?: string;

  @ApiPropertyOptional({ example: '5901234567890' })
  @IsOptional() @IsString() @MaxLength(100)
  barcode?: string;

  @ApiProperty({ example: 'Engine Oil 5W-30 1L' })
  @IsString() @MinLength(1) @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Oils & Lubricants' })
  @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Shell' })
  @IsOptional() @IsString() @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'EA' })
  @IsOptional() @IsString() @MaxLength(20)
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional() @IsNumber() @Min(0)
  quantityOnHand?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  quantityReserved?: number;

  @ApiProperty({ example: 8.50 })
  @IsNumber() @Min(0)
  unitCost: number;

  @ApiProperty({ example: 15.99 })
  @IsNumber() @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsNumber() @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional() @IsNumber() @Min(0)
  reorderQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0) @Max(9999)
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  trackBatch?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  trackSerial?: boolean;
}
