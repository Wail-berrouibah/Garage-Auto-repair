import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  branchId?: string;

  @ApiProperty({ example: 'SUP-001' })
  @IsString() @MinLength(1) @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Auto Parts Co.' })
  @IsString() @MinLength(1) @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional() @IsString() @MaxLength(255)
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'contact@autoparts.com' })
  @IsOptional() @IsString() @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0100' })
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional({ example: 'NET30' })
  @IsOptional() @IsString() @MaxLength(100)
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}
