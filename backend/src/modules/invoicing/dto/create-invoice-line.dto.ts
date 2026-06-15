import { IsString, IsNumber, IsOptional, IsIn, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceLineDto {
  @ApiProperty({ enum: ['LABOR', 'PART', 'FEE'] })
  @IsString() @IsIn(['LABOR', 'PART', 'FEE'])
  lineType: string;

  @ApiProperty({ example: 'Oil Change Service' })
  @IsString() @MaxLength(500)
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber() @Min(1)
  quantity: number;

  @ApiProperty({ example: 49.99 })
  @IsNumber() @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @IsNumber() @Min(0)
  discount?: number;
}
