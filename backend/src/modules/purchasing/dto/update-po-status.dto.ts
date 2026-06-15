import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'SHIPPED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;

export class UpdatePoStatusDto {
  @ApiProperty({ enum: VALID_STATUSES })
  @IsString()
  @IsIn(VALID_STATUSES)
  status: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}
