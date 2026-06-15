import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQcInspectionDto {
  @ApiPropertyOptional({ example: 'PASS' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  result?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
