import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLaborEntryDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty()
  @IsString()
  mechanicId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  actualHours: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ default: 'HOURLY' })
  @IsOptional()
  @IsString()
  rateUnit?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lineTotal?: number;
}
