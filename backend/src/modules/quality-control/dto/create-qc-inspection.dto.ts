import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQcCheckDto {
  @ApiProperty()
  @IsString()
  checklistItemId: string;

  @ApiProperty()
  @IsBoolean()
  passed: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQcInspectionDto {
  @ApiProperty()
  @IsString()
  workOrderId: string;

  @ApiProperty()
  @IsString()
  checklistTemplateId: string;

  @ApiProperty({ example: 'PASS' })
  @IsString()
  @MaxLength(10)
  result: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateQcCheckDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQcCheckDto)
  checks?: CreateQcCheckDto[];
}
